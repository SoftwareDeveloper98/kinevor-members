using Kinevor.Modules.Members.Domain;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Members.Application;

/// <summary>Lists the authenticated member's progress entries.</summary>
public record GetMyProgressQuery(Guid MemberId, DateTime? From, DateTime? To)
    : IRequest<IReadOnlyList<ProgressEntryDto>>;

/// <summary>Handles <see cref="GetMyProgressQuery"/>.</summary>
public class GetMyProgressHandler(IMemberEngagementRepository engagement)
    : IRequestHandler<GetMyProgressQuery, IReadOnlyList<ProgressEntryDto>>
{
    /// <summary>Returns progress entries in the requested range.</summary>
    public async Task<IReadOnlyList<ProgressEntryDto>> Handle(GetMyProgressQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        var entries = await engagement.GetProgressAsync(query.MemberId, query.From, query.To, ct);
        return entries.Select(MemberMapper.ToDto).ToList();
    }
}

/// <summary>Lists the authenticated member's consent records.</summary>
public record GetMyConsentsQuery(Guid MemberId) : IRequest<IReadOnlyList<ConsentDto>>;

/// <summary>Handles <see cref="GetMyConsentsQuery"/>.</summary>
public class GetMyConsentsHandler(IMemberEngagementRepository engagement)
    : IRequestHandler<GetMyConsentsQuery, IReadOnlyList<ConsentDto>>
{
    /// <summary>Returns the consent history.</summary>
    public async Task<IReadOnlyList<ConsentDto>> Handle(GetMyConsentsQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        var consents = await engagement.GetConsentsAsync(query.MemberId, ct);
        return consents.Select(MemberMapper.ToDto).ToList();
    }
}

/// <summary>Grants a consent for the authenticated member.</summary>
public record GrantConsentCommand(Guid MemberId, string Key, string Culture = "en") : ICommand;

/// <summary>Handles <see cref="GrantConsentCommand"/>.</summary>
public class GrantConsentHandler(
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork,
    TimeProvider clock) : IRequestHandler<GrantConsentCommand>
{
    /// <summary>Creates or re-grants the consent.</summary>
    public async Task Handle(GrantConsentCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (string.IsNullOrWhiteSpace(command.Key))
            throw new DomainException("A consent key is required.");

        var now = clock.GetUtcNow().UtcDateTime;
        var existing = await engagement.GetConsentAsync(command.MemberId, command.Key, ct);
        if (existing is null)
        {
            await engagement.AddConsentAsync(MemberConsent.Grant(
                command.MemberId, command.Key, ConsentKeys.CurrentVersion, command.Culture, "self-service", now), ct);
        }
        else
        {
            existing.ReGrant(ConsentKeys.CurrentVersion, command.Culture, "self-service", now);
            engagement.UpdateConsent(existing);
        }

        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Withdraws a consent for the authenticated member.</summary>
public record WithdrawConsentCommand(Guid MemberId, string Key) : ICommand;

/// <summary>Handles <see cref="WithdrawConsentCommand"/>.</summary>
public class WithdrawConsentHandler(
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork,
    TimeProvider clock) : IRequestHandler<WithdrawConsentCommand>
{
    /// <summary>Marks an existing consent as withdrawn.</summary>
    public async Task Handle(WithdrawConsentCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var consent = await engagement.GetConsentAsync(command.MemberId, command.Key, ct)
            ?? throw new NotFoundException("Consent", command.Key);

        consent.Withdraw(clock.GetUtcNow().UtcDateTime);
        engagement.UpdateConsent(consent);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Lists the authenticated member's registered devices.</summary>
public record GetMyDevicesQuery(Guid MemberId) : IRequest<IReadOnlyList<DeviceDto>>;

/// <summary>Handles <see cref="GetMyDevicesQuery"/>.</summary>
public class GetMyDevicesHandler(IMemberEngagementRepository engagement)
    : IRequestHandler<GetMyDevicesQuery, IReadOnlyList<DeviceDto>>
{
    /// <summary>Returns masked device projections.</summary>
    public async Task<IReadOnlyList<DeviceDto>> Handle(GetMyDevicesQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);
        var devices = await engagement.GetDevicesAsync(query.MemberId, ct);
        return devices.Select(MemberMapper.ToDto).ToList();
    }
}

/// <summary>Registers a push device for the authenticated member.</summary>
public record RegisterDeviceCommand(Guid MemberId, string Token, string Platform) : ICommand<Guid>;

/// <summary>Handles <see cref="RegisterDeviceCommand"/>.</summary>
public class RegisterDeviceHandler(
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork) : IRequestHandler<RegisterDeviceCommand, Guid>
{
    /// <summary>Creates or returns the existing device registration.</summary>
    public async Task<Guid> Handle(RegisterDeviceCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var existing = await engagement.GetDeviceAsync(command.MemberId, command.Token, ct);
        if (existing is not null) return existing.Id;

        var created = MemberDevice.Create(command.MemberId, command.Token, command.Platform);
        if (created.IsFailure) throw new DomainException(created.Error.Message);

        await engagement.AddDeviceAsync(created.Value, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return created.Value.Id;
    }
}

/// <summary>Removes a push device from the authenticated member.</summary>
public record RemoveDeviceCommand(Guid MemberId, string Token) : ICommand;

/// <summary>Handles <see cref="RemoveDeviceCommand"/>.</summary>
public class RemoveDeviceHandler(
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork) : IRequestHandler<RemoveDeviceCommand>
{
    /// <summary>Deletes the matching device registration.</summary>
    public async Task Handle(RemoveDeviceCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var device = await engagement.GetDeviceAsync(command.MemberId, command.Token, ct)
            ?? throw new NotFoundException("MemberDevice", command.Token);

        engagement.RemoveDevice(device);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Builds a personal-data export for the authenticated member.</summary>
public record ExportMyDataQuery(Guid MemberId) : IRequest<MemberPrivacyExportDto>;

/// <summary>Handles <see cref="ExportMyDataQuery"/>.</summary>
public class ExportMyDataHandler(
    IMemberRepository members,
    IMemberEngagementRepository engagement,
    TimeProvider clock) : IRequestHandler<ExportMyDataQuery, MemberPrivacyExportDto>
{
    /// <summary>Aggregates the member-owned data in this module.</summary>
    public async Task<MemberPrivacyExportDto> Handle(ExportMyDataQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);

        var now = clock.GetUtcNow().UtcDateTime;
        var member = await members.GetByIdAsync(query.MemberId, ct)
            ?? throw new NotFoundException("Member", query.MemberId);

        var progress = await engagement.GetProgressAsync(query.MemberId, null, null, ct);
        var consents = await engagement.GetConsentsAsync(query.MemberId, ct);
        var devices = await engagement.GetDevicesAsync(query.MemberId, ct);

        return new MemberPrivacyExportDto(
            now,
            MemberMapper.ToDetail(member, true, now),
            progress.Select(MemberMapper.ToDto).ToList(),
            consents.Select(MemberMapper.ToDto).ToList(),
            devices.Select(MemberMapper.ToDto).ToList());
    }
}

/// <summary>Erases the authenticated member's personal data.</summary>
public record EraseMyDataCommand(Guid MemberId, string Culture = "en") : ICommand<ErasureResultDto>;

/// <summary>Handles <see cref="EraseMyDataCommand"/>.</summary>
public class EraseMyDataHandler(
    IMemberRepository members,
    IMemberEngagementRepository engagement,
    IMembersUnitOfWork unitOfWork,
    TimeProvider clock) : IRequestHandler<EraseMyDataCommand, ErasureResultDto>
{
    /// <summary>Anonymizes the member and purges engagement data.</summary>
    public async Task<ErasureResultDto> Handle(EraseMyDataCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var now = clock.GetUtcNow().UtcDateTime;
        var member = await members.GetByIdAsync(command.MemberId, ct)
            ?? throw new NotFoundException("Member", command.MemberId);

        var requested = member.RequestErasure(now);
        if (requested.IsFailure) throw new DomainException(requested.Error.Message);

        member.Anonymize(now);
        members.Update(member);
        await engagement.PurgeAsync(command.MemberId, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return new ErasureResultDto(
            member.Id,
            member.ErasureRequestedAt ?? now,
            "Your erasure request was processed. Profile, health, progress and device data were removed. Consent history is retained as a legal record.");
    }
}
