using Kinevor.Modules.Members.Domain;

namespace Kinevor.Modules.Members.Application;

/// <summary>Compact member row used by the staff directory.</summary>
public record MemberSummaryDto(
    Guid Id,
    string MemberNumber,
    string FullName,
    string Email,
    string Phone,
    string Gender,
    int Age,
    string Status,
    string? PhotoUrl,
    DateTime JoinedAt);

/// <summary>Full member profile; sensitive fields are masked unless explicitly revealed.</summary>
public record MemberDetailDto(
    Guid Id,
    string MemberNumber,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string Phone,
    DateTime DateOfBirth,
    int Age,
    string Gender,
    double? WeightKg,
    double? HeightCm,
    bool HasMedicalConditions,
    string? MedicalNotes,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? State,
    string Country,
    string? PostalCode,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string Status,
    DateTime? FrozenUntil,
    string? FreezeReason,
    int TotalCheckIns,
    DateTime? LastCheckInAt,
    Guid? BranchId,
    string? PhotoUrl,
    bool Revealed,
    DateTime JoinedAt);

/// <summary>Progress entry projection.</summary>
public record ProgressEntryDto(
    Guid Id,
    string Kind,
    string? Label,
    double? Value,
    string? Unit,
    string? Notes,
    DateTime RecordedAt);

/// <summary>Consent projection for the member area.</summary>
public record ConsentDto(
    string Key,
    string Version,
    bool Granted,
    DateTime GrantedAt,
    DateTime? WithdrawnAt,
    string Culture,
    string Source);

/// <summary>Registered push device projection.</summary>
public record DeviceDto(Guid Id, string Platform, string TokenPreview, DateTime RegisteredAt);

/// <summary>Personal-data export for the member module boundary (GDPR art. 20).</summary>
public record MemberPrivacyExportDto(
    DateTime ExportedAt,
    MemberDetailDto Profile,
    IReadOnlyList<ProgressEntryDto> Progress,
    IReadOnlyList<ConsentDto> Consents,
    IReadOnlyList<DeviceDto> Devices);

/// <summary>Outcome of a privacy erasure request.</summary>
public record ErasureResultDto(Guid MemberId, DateTime RequestedAt, string Confirmation);

/// <summary>Consent input accepted during registration.</summary>
public record ConsentInput(string Key, string? Version, bool Granted);

internal static class MemberMapper
{
    internal static MemberSummaryDto ToSummary(Member member, DateTime now) => new(
        member.Id,
        member.MemberNumber,
        member.FullName,
        MaskEmail(member.Email.Value),
        MaskPhone(member.Phone.Value),
        member.Gender.ToString(),
        member.AgeAt(now),
        member.Status.ToString(),
        member.PhotoUrl,
        member.CreatedAt);

    internal static MemberDetailDto ToDetail(Member member, bool reveal, DateTime now) => new(
        member.Id,
        member.MemberNumber,
        member.FirstName,
        member.LastName,
        member.FullName,
        reveal ? member.Email.Value : MaskEmail(member.Email.Value),
        reveal ? member.Phone.Value : MaskPhone(member.Phone.Value),
        member.DateOfBirth,
        member.AgeAt(now),
        member.Gender.ToString(),
        member.WeightKg,
        member.HeightCm,
        member.HasMedicalConditions,
        reveal ? member.MedicalNotes : member.HasMedicalConditions ? "Hidden until revealed" : null,
        member.AddressLine1,
        member.AddressLine2,
        member.City,
        member.State,
        member.Country,
        member.PostalCode,
        reveal ? member.EmergencyContactName : member.EmergencyContactName is null ? null : "Hidden",
        reveal ? member.EmergencyContactPhone : member.EmergencyContactPhone is null ? null : "Hidden",
        member.Status.ToString(),
        member.FrozenUntil,
        member.FreezeReason,
        member.TotalCheckIns,
        member.LastCheckInAt,
        member.BranchId,
        member.PhotoUrl,
        reveal,
        member.CreatedAt);

    internal static ProgressEntryDto ToDto(ProgressEntry entry) => new(
        entry.Id,
        entry.Kind.ToString(),
        entry.Label,
        entry.Value,
        entry.Unit,
        entry.Notes,
        entry.RecordedAt);

    internal static ConsentDto ToDto(MemberConsent consent) => new(
        consent.Key,
        consent.Version,
        consent.IsGranted,
        consent.GrantedAt,
        consent.WithdrawnAt,
        consent.Culture,
        consent.Source);

    internal static DeviceDto ToDto(MemberDevice device) => new(
        device.Id,
        device.Platform,
        MaskToken(device.Token),
        device.CreatedAt);

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1) return "***";
        return $"{email[0]}***{email[at..]}";
    }

    private static string MaskPhone(string phone) =>
        phone.Length <= 4 ? "***" : $"***{phone[^4..]}";

    private static string MaskToken(string token) =>
        token.Length <= 10 ? "***" : $"{token[..6]}...{token[^4..]}";
}
