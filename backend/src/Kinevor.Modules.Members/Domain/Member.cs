using Kinevor.Platform.Domain.Common;
using Kinevor.Platform.Domain.ValueObjects;

namespace Kinevor.Modules.Members.Domain;

/// <summary>Member aggregate root: identity, contact, health profile and lifecycle state.</summary>
public sealed class Member : AggregateRoot
{
    private Member()
    {
    }

    /// <summary>Human-friendly member number (KZN-YYYY-NNNNN).</summary>
    public string MemberNumber { get; private set; } = string.Empty;

    /// <summary>Legal first name.</summary>
    public string FirstName { get; private set; } = string.Empty;

    /// <summary>Legal last name.</summary>
    public string LastName { get; private set; } = string.Empty;

    /// <summary>First and last name combined.</summary>
    public string FullName => $"{FirstName} {LastName}".Trim();

    /// <summary>Normalized e-mail address.</summary>
    public Email Email { get; private set; } = null!;

    /// <summary>Normalized phone number.</summary>
    public PhoneNumber Phone { get; private set; } = null!;

    /// <summary>Date of birth.</summary>
    public DateTime DateOfBirth { get; private set; }

    /// <summary>Gender captured at registration.</summary>
    public Gender Gender { get; private set; }

    /// <summary>Body weight in kilograms.</summary>
    public double? WeightKg { get; private set; }

    /// <summary>Height in centimetres.</summary>
    public double? HeightCm { get; private set; }

    /// <summary>Free-text medical notes; sensitive.</summary>
    public string? MedicalNotes { get; private set; }

    /// <summary>Whether the member disclosed a relevant medical condition.</summary>
    public bool HasMedicalConditions { get; private set; }

    /// <summary>First address line.</summary>
    public string AddressLine1 { get; private set; } = string.Empty;

    /// <summary>Second address line.</summary>
    public string? AddressLine2 { get; private set; }

    /// <summary>City.</summary>
    public string City { get; private set; } = string.Empty;

    /// <summary>State or region.</summary>
    public string? State { get; private set; }

    /// <summary>Country.</summary>
    public string Country { get; private set; } = string.Empty;

    /// <summary>Postal code.</summary>
    public string? PostalCode { get; private set; }

    /// <summary>Emergency contact name.</summary>
    public string? EmergencyContactName { get; private set; }

    /// <summary>Emergency contact phone number.</summary>
    public string? EmergencyContactPhone { get; private set; }

    /// <summary>Current lifecycle status.</summary>
    public MemberStatus Status { get; private set; } = MemberStatus.Active;

    /// <summary>Date the freeze ends, when frozen.</summary>
    public DateTime? FrozenUntil { get; private set; }

    /// <summary>Reason recorded when the member was frozen.</summary>
    public string? FreezeReason { get; private set; }

    /// <summary>Lifetime check-in counter.</summary>
    public int TotalCheckIns { get; private set; }

    /// <summary>Timestamp of the most recent check-in.</summary>
    public DateTime? LastCheckInAt { get; private set; }

    /// <summary>Branch the member belongs to.</summary>
    public Guid? BranchId { get; private set; }

    /// <summary>Optional profile photo URL.</summary>
    public string? PhotoUrl { get; private set; }

    /// <summary>Timestamp of the erasure request.</summary>
    public DateTime? ErasureRequestedAt { get; private set; }

    /// <summary>Returns the member's age at <paramref name="now"/>.</summary>
    public int AgeAt(DateTime now) => (int)((now - DateOfBirth).TotalDays / 365.25);

    /// <summary>Creates a validated member and assigns a yearly sequence number.</summary>
    public static Result<Member> Create(
        DateTime now,
        int yearSequence,
        string firstName,
        string lastName,
        string email,
        string phone,
        DateTime dateOfBirth,
        Gender gender,
        double? weightKg,
        double? heightCm,
        string? medicalNotes,
        bool hasMedicalConditions,
        string addressLine1,
        string? addressLine2,
        string city,
        string? state,
        string country,
        string? postalCode,
        string? emergencyContactName,
        string? emergencyContactPhone,
        string? photoUrl = null)
    {
        var names = ValidateNames(firstName, lastName);
        if (names.IsFailure) return Result.Failure<Member>(names.Error);

        var age = (now - dateOfBirth).TotalDays / 365.25;
        if (age < 14)
            return Result.Failure<Member>(Error.Business("Member.TooYoung", "Member must be at least 14 years old."));
        if (age > 100)
            return Result.Failure<Member>(Error.Business("Member.InvalidAge", "Invalid date of birth."));

        var emailResult = Email.Create(email);
        if (emailResult.IsFailure) return Result.Failure<Member>(emailResult.Error);

        var phoneResult = PhoneNumber.Create(phone);
        if (phoneResult.IsFailure) return Result.Failure<Member>(phoneResult.Error);

        var addressResult = ValidateAddress(addressLine1, city, country);
        if (addressResult.IsFailure) return Result.Failure<Member>(addressResult.Error);

        var body = ValidateBody(weightKg, heightCm);
        if (body.IsFailure) return Result.Failure<Member>(body.Error);

        if (yearSequence < 1)
            return Result.Failure<Member>(Error.Validation("MemberNumber", "Year sequence must be positive."));

        return Result.Success(new Member
        {
            MemberNumber = $"KZN-{now.Year}-{yearSequence:D5}",
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Email = emailResult.Value,
            Phone = phoneResult.Value,
            DateOfBirth = dateOfBirth.Date,
            Gender = gender,
            WeightKg = weightKg,
            HeightCm = heightCm,
            MedicalNotes = medicalNotes?.Trim(),
            HasMedicalConditions = hasMedicalConditions,
            AddressLine1 = addressLine1.Trim(),
            AddressLine2 = addressLine2?.Trim(),
            City = city.Trim(),
            State = state?.Trim(),
            Country = country.Trim(),
            PostalCode = postalCode?.Trim(),
            EmergencyContactName = emergencyContactName?.Trim(),
            EmergencyContactPhone = emergencyContactPhone?.Trim(),
            Status = MemberStatus.Active,
            PhotoUrl = photoUrl,
        });
    }

    /// <summary>Updates contact and physical profile fields.</summary>
    public Result UpdateProfile(
        string firstName,
        string lastName,
        string phone,
        double? weightKg,
        double? heightCm,
        string? medicalNotes,
        bool hasMedicalConditions,
        string? emergencyContactName,
        string? emergencyContactPhone)
    {
        var names = ValidateNames(firstName, lastName);
        if (names.IsFailure) return names;

        var phoneResult = PhoneNumber.Create(phone);
        if (phoneResult.IsFailure) return Result.Failure(phoneResult.Error);

        var body = ValidateBody(weightKg, heightCm);
        if (body.IsFailure) return body;

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Phone = phoneResult.Value;
        WeightKg = weightKg;
        HeightCm = heightCm;
        MedicalNotes = medicalNotes?.Trim();
        HasMedicalConditions = hasMedicalConditions;
        EmergencyContactName = emergencyContactName?.Trim();
        EmergencyContactPhone = emergencyContactPhone?.Trim();
        return Result.Success();
    }

    /// <summary>Freezes an active member until the given date.</summary>
    public Result Freeze(string reason, DateTime frozenUntil, DateTime now)
    {
        if (Status != MemberStatus.Active)
            return Result.Failure(Error.Business("Member.NotActive", "Only active members can be frozen."));
        if (frozenUntil <= now)
            return Result.Failure(Error.Validation("FrozenUntil", "Freeze end date must be in the future."));
        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure(Error.Validation("Reason", "A freeze reason is required."));

        Status = MemberStatus.Frozen;
        FreezeReason = reason.Trim();
        FrozenUntil = frozenUntil;
        return Result.Success();
    }

    /// <summary>Returns a frozen member to active status.</summary>
    public Result Unfreeze()
    {
        if (Status != MemberStatus.Frozen)
            return Result.Failure(Error.Business("Member.NotFrozen", "Member is not frozen."));

        Status = MemberStatus.Active;
        FreezeReason = null;
        FrozenUntil = null;
        return Result.Success();
    }

    /// <summary>Records a completed gym visit and updates the lifetime counters.</summary>
    public void RecordCheckIn(DateTime at)
    {
        TotalCheckIns++;
        LastCheckInAt = at;
    }

    /// <summary>Assigns the member to a branch.</summary>
    public void AssignBranch(Guid branchId) => BranchId = branchId;

    /// <summary>Records an erasure request.</summary>
    public Result RequestErasure(DateTime now)
    {
        if (Status == MemberStatus.Suspended)
            return Result.Failure(Error.Business("Member.Suspended", "Suspended members cannot request erasure."));

        ErasureRequestedAt = now;
        return Result.Success();
    }

    /// <summary>Replaces personal data with redacted placeholders after erasure.</summary>
    public void Anonymize(DateTime now)
    {
        FirstName = "Redacted";
        LastName = "Member";
        Email = Email.Create($"erased.{Id:N}@anonymized.invalid").Value;
        Phone = PhoneNumber.Create("+9000000000").Value;
        MedicalNotes = null;
        HasMedicalConditions = false;
        WeightKg = null;
        HeightCm = null;
        AddressLine1 = "Redacted";
        AddressLine2 = null;
        City = "Redacted";
        State = null;
        Country = "Redacted";
        PostalCode = null;
        EmergencyContactName = null;
        EmergencyContactPhone = null;
        PhotoUrl = null;
        ErasureRequestedAt ??= now;
    }

    private static Result ValidateNames(string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            return Result.Failure(Error.Validation("FirstName", "First name is required."));
        if (string.IsNullOrWhiteSpace(lastName))
            return Result.Failure(Error.Validation("LastName", "Last name is required."));
        if (firstName.Trim().Length > 100 || lastName.Trim().Length > 100)
            return Result.Failure(Error.Validation("Name", "Names must be 100 characters or fewer."));
        return Result.Success();
    }

    private static Result ValidateAddress(string addressLine1, string city, string country)
    {
        if (string.IsNullOrWhiteSpace(addressLine1))
            return Result.Failure(Error.Validation("AddressLine1", "Address line 1 is required."));
        if (string.IsNullOrWhiteSpace(city))
            return Result.Failure(Error.Validation("City", "City is required."));
        if (string.IsNullOrWhiteSpace(country))
            return Result.Failure(Error.Validation("Country", "Country is required."));
        return Result.Success();
    }

    private static Result ValidateBody(double? weightKg, double? heightCm)
    {
        if (weightKg is < 0 or > 500)
            return Result.Failure(Error.Validation("WeightKg", "Weight must be between 0 and 500 kg."));
        if (heightCm is < 0 or > 300)
            return Result.Failure(Error.Validation("HeightCm", "Height must be between 0 and 300 cm."));
        return Result.Success();
    }
}
