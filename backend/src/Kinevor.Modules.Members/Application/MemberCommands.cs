using Kinevor.Modules.Members.Domain;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Members.Application;

/// <summary>Registers a new member with optional consent records.</summary>
public record RegisterMemberCommand(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime DateOfBirth,
    string Gender,
    double? WeightKg,
    double? HeightCm,
    string? MedicalNotes,
    bool HasMedicalConditions,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? State,
    string Country,
    string? PostalCode,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? PhotoUrl = null,
    IReadOnlyList<ConsentInput>? Consents = null) : ICommand<Guid>;

/// <summary>Handles <see cref="RegisterMemberCommand"/>.</summary>
public class RegisterMemberHandler(
    IMemberRepository members,
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork,
    TimeProvider clock) : IRequestHandler<RegisterMemberCommand, Guid>
{
    /// <summary>Validates, creates and persists the member.</summary>
    public async Task<Guid> Handle(RegisterMemberCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var existing = await members.GetByEmailAsync(command.Email, ct);
        if (existing is not null)
            throw new ConflictException($"E-mail '{command.Email}' is already registered.");

        if (!Enum.TryParse<Gender>(command.Gender, true, out var gender))
            throw new DomainException($"Invalid gender value: {command.Gender}.");

        ValidateHealthConsent(command);

        var now = clock.GetUtcNow().UtcDateTime;
        var sequence = await members.GetYearSequenceAsync(now.Year, ct);
        var created = Member.Create(
            now, sequence, command.FirstName, command.LastName, command.Email, command.Phone,
            command.DateOfBirth, gender, command.WeightKg, command.HeightCm,
            command.MedicalNotes, command.HasMedicalConditions,
            command.AddressLine1, command.AddressLine2, command.City, command.State,
            command.Country, command.PostalCode,
            command.EmergencyContactName, command.EmergencyContactPhone, command.PhotoUrl);

        if (created.IsFailure) throw new DomainException(created.Error.Message);

        var member = created.Value;
        members.Add(member);

        foreach (var consent in command.Consents ?? [])
        {
            if (!consent.Granted || string.IsNullOrWhiteSpace(consent.Key)) continue;
            await engagement.AddConsentAsync(MemberConsent.Grant(
                member.Id,
                consent.Key,
                consent.Version ?? ConsentKeys.CurrentVersion,
                "en",
                "staff",
                now), ct);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return member.Id;
    }

    private static void ValidateHealthConsent(RegisterMemberCommand command)
    {
        var hasHealthData = command.HasMedicalConditions || !string.IsNullOrWhiteSpace(command.MedicalNotes);
        if (!hasHealthData) return;

        var granted = command.Consents?.Any(consent =>
            consent.Granted &&
            string.Equals(consent.Key?.Trim(), ConsentKeys.HealthData, StringComparison.OrdinalIgnoreCase)) == true;

        if (!granted)
            throw new DomainException("Health data requires a health_data consent captured from the member.");
    }
}

/// <summary>Updates a member profile.</summary>
public record UpdateMemberCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string Phone,
    double? WeightKg,
    double? HeightCm,
    string? MedicalNotes,
    bool HasMedicalConditions,
    string? EmergencyContactName,
    string? EmergencyContactPhone) : ICommand;

/// <summary>Handles <see cref="UpdateMemberCommand"/>.</summary>
public class UpdateMemberHandler(IMemberRepository members, IMembersUnitOfWork unitOfWork)
    : IRequestHandler<UpdateMemberCommand>
{
    /// <summary>Applies the update to the aggregate.</summary>
    public async Task Handle(UpdateMemberCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var member = await members.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException("Member", command.Id);

        var updated = member.UpdateProfile(
            command.FirstName, command.LastName, command.Phone, command.WeightKg,
            command.HeightCm, command.MedicalNotes, command.HasMedicalConditions,
            command.EmergencyContactName, command.EmergencyContactPhone);

        if (updated.IsFailure) throw new DomainException(updated.Error.Message);

        members.Update(member);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Freezes an active member until a date.</summary>
public record FreezeMemberCommand(Guid Id, string Reason, DateTime FrozenUntil) : ICommand;

/// <summary>Handles <see cref="FreezeMemberCommand"/>.</summary>
public class FreezeMemberHandler(IMemberRepository members, IMembersUnitOfWork unitOfWork, TimeProvider clock)
    : IRequestHandler<FreezeMemberCommand>
{
    /// <summary>Freezes the member and persists the change.</summary>
    public async Task Handle(FreezeMemberCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var member = await members.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException("Member", command.Id);

        var frozen = member.Freeze(command.Reason, command.FrozenUntil, clock.GetUtcNow().UtcDateTime);
        if (frozen.IsFailure) throw new DomainException(frozen.Error.Message);

        members.Update(member);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Unfreezes a frozen member.</summary>
public record UnfreezeMemberCommand(Guid Id) : ICommand;

/// <summary>Handles <see cref="UnfreezeMemberCommand"/>.</summary>
public class UnfreezeMemberHandler(IMemberRepository members, IMembersUnitOfWork unitOfWork)
    : IRequestHandler<UnfreezeMemberCommand>
{
    /// <summary>Returns the member to active status.</summary>
    public async Task Handle(UnfreezeMemberCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var member = await members.GetByIdAsync(command.Id, ct)
            ?? throw new NotFoundException("Member", command.Id);

        var unfrozen = member.Unfreeze();
        if (unfrozen.IsFailure) throw new DomainException(unfrozen.Error.Message);

        members.Update(member);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Creates a progress entry for the authenticated member.</summary>
public record AddProgressEntryCommand(
    Guid MemberId,
    string Kind,
    string? Label,
    double? Value,
    string? Unit,
    string? Notes,
    DateTime? RecordedAt) : ICommand<Guid>;

/// <summary>Handles <see cref="AddProgressEntryCommand"/>.</summary>
public class AddProgressEntryHandler(
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork,
    TimeProvider clock) : IRequestHandler<AddProgressEntryCommand, Guid>
{
    /// <summary>Creates and persists the progress entry.</summary>
    public async Task<Guid> Handle(AddProgressEntryCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (!Enum.TryParse<ProgressKind>(command.Kind, true, out var kind))
            throw new DomainException(
                $"Kind must be one of: {string.Join(", ", Enum.GetNames<ProgressKind>()).ToLowerInvariant()}.");

        var now = clock.GetUtcNow().UtcDateTime;
        var created = ProgressEntry.Create(
            command.MemberId, kind, command.Label, command.Value, command.Unit,
            command.Notes, command.RecordedAt ?? now, now);

        if (created.IsFailure) throw new DomainException(created.Error.Message);

        await engagement.AddProgressAsync(created.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return created.Value.Id;
    }
}
