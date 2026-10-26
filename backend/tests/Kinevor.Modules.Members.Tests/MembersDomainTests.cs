using Xunit;
using Kinevor.Modules.Members.Domain;
using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Members.Tests;

/// <summary>Domain invariants for members, progress, consents and devices.</summary>
public class MembersDomainTests
{
    private static readonly DateTime Now = new(2026, 10, 20, 12, 0, 0, DateTimeKind.Utc);

    /// <summary>E-mail addresses are normalized to lower case.</summary>
    [Fact]
    public void Create_NormalizesEmail()
    {
        var member = CreateMember("  MAYA@Example.COM  ");

        Assert.True(member.IsSuccess);
        Assert.Equal("maya@example.com", member.Value.Email.Value);
        Assert.StartsWith("KZN-2026-", member.Value.MemberNumber);
    }

    /// <summary>Members younger than fourteen are rejected.</summary>
    [Fact]
    public void Create_RejectsUnderageMember()
    {
        var member = CreateMember(dateOfBirth: Now.AddYears(-13));

        Assert.True(member.IsFailure);
        Assert.Equal("Member.TooYoung", member.Error.Code);
    }

    /// <summary>Freezing requires an active member and a future date.</summary>
    [Fact]
    public void Freeze_ValidatesStateAndDate()
    {
        var member = CreateMember().Value;

        var past = member.Freeze("Travel", Now.AddDays(-1), Now);
        Assert.True(past.IsFailure);
        Assert.Equal("Validation.FrozenUntil", past.Error.Code);

        var frozen = member.Freeze("Travel", Now.AddDays(10), Now);
        Assert.True(frozen.IsSuccess);
        Assert.Equal(MemberStatus.Frozen, member.Status);
        Assert.Equal("Travel", member.FreezeReason);

        Assert.True(member.Unfreeze().IsSuccess);
        Assert.Equal(MemberStatus.Active, member.Status);
        Assert.Null(member.FreezeReason);
    }

    /// <summary>Only active members can be frozen.</summary>
    [Fact]
    public void Freeze_RejectsAlreadyFrozenMember()
    {
        var member = CreateMember().Value;
        Assert.True(member.Freeze("Travel", Now.AddDays(10), Now).IsSuccess);

        var second = member.Freeze("Again", Now.AddDays(20), Now);

        Assert.True(second.IsFailure);
        Assert.Equal("Member.NotActive", second.Error.Code);
    }

    /// <summary>Progress entries reject future measurements.</summary>
    [Fact]
    public void Progress_RejectsFutureRecordedAt()
    {
        var entry = ProgressEntry.Create(
            Guid.NewGuid(), ProgressKind.Weight, null, 70, "kg", null, Now.AddDays(1), Now);

        Assert.True(entry.IsFailure);
        Assert.Equal("Validation.RecordedAt", entry.Error.Code);
    }

    /// <summary>Records and photos require a label.</summary>
    [Fact]
    public void Progress_RequiresLabelForRecords()
    {
        var entry = ProgressEntry.Create(
            Guid.NewGuid(), ProgressKind.PersonalRecord, null, 100, "kg", null, Now, Now);

        Assert.True(entry.IsFailure);
        Assert.Equal("Validation.Label", entry.Error.Code);
    }

    /// <summary>Devices accept known platforms and normalize case.</summary>
    [Fact]
    public void Device_NormalizesPlatformAndRejectsUnknown()
    {
        var created = MemberDevice.Create(Guid.NewGuid(), " token-123 ", "IOS");
        Assert.True(created.IsSuccess);
        Assert.Equal("ios", created.Value.Platform);
        Assert.Equal("token-123", created.Value.Token);

        var invalid = MemberDevice.Create(Guid.NewGuid(), "token", "desktop");
        Assert.True(invalid.IsFailure);
    }

    /// <summary>Check-ins update the lifetime counter and last visit.</summary>
    [Fact]
    public void RecordCheckIn_IncrementsCounters()
    {
        var member = CreateMember().Value;

        member.RecordCheckIn(Now.AddHours(-2));
        member.RecordCheckIn(Now);

        Assert.Equal(2, member.TotalCheckIns);
        Assert.Equal(Now, member.LastCheckInAt);
    }

    /// <summary>Erasure redacts personal and health data.</summary>
    [Fact]
    public void Erasure_AnonymizesMember()
    {
        var member = CreateMember().Value;
        member.UpdateProfile(
            "Maya", "Thompson", "+447700900111", 68, 168,
            "Asthma", true, "Ethan", "+447700900112");

        Assert.True(member.RequestErasure(Now).IsSuccess);
        member.Anonymize(Now);

        Assert.Equal("Redacted Member", member.FullName);
        Assert.EndsWith("@anonymized.invalid", member.Email.Value);
        Assert.Null(member.MedicalNotes);
        Assert.False(member.HasMedicalConditions);
        Assert.Equal("Redacted", member.AddressLine1);
        Assert.Null(member.EmergencyContactPhone);
        Assert.Equal(Now, member.ErasureRequestedAt);
    }

    private static Result<Member> CreateMember(
        string email = "maya@example.com",
        DateTime? dateOfBirth = null) =>
        Member.Create(
            Now,
            1,
            "Maya",
            "Thompson",
            email,
            "+447700900111",
            dateOfBirth ?? new DateTime(1994, 4, 12, 0, 0, 0, DateTimeKind.Utc),
            Gender.Female,
            68,
            168,
            null,
            false,
            "14 Camden High Street",
            null,
            "London",
            null,
            "United Kingdom",
            "NW1 0JH",
            "Ethan Thompson",
            "+447700900112");
}
