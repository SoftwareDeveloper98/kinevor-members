using Kinevor.Modules.Members.Domain;
using Kinevor.Modules.Members.EntityFrameworkCore;

namespace Kinevor.Modules.Members.DemoApi.Data;

/// <summary>Seeds deterministic members, progress, consents and devices.</summary>
public static class DemoDataSeeder
{
    /// <summary>Id of the first seeded member, used by demos and documentation.</summary>
    public static readonly Guid PrimaryMemberId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>Adds demo data when the database is empty.</summary>
    public static async Task SeedAsync(MembersDbContext db, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(db);

        if (db.Members.Any())
            return;

        var now = DateTime.UtcNow;
        var seeds = new[]
        {
            new Seed(
                PrimaryMemberId,
                "Maya", "Thompson", "maya.thompson@kinevor.demo", "+447700900111",
                new DateTime(1994, 4, 12, 0, 0, 0, DateTimeKind.Utc), Gender.Female,
                68.4, 168, false, null,
                "14 Camden High Street", "Flat 3", "London", "Greater London", "United Kingdom", "NW1 0JH",
                "Ethan Thompson", "+447700900112"),
            new Seed(
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                "Daniel", "Okafor", "daniel.okafor@kinevor.demo", "+447700900221",
                new DateTime(1990, 9, 3, 0, 0, 0, DateTimeKind.Utc), Gender.Male,
                84.1, 181, true, "Mild asthma; inhaler in gym bag.",
                "7 Brewery Road", null, "London", null, "United Kingdom", "N7 9QH",
                "Ada Okafor", "+447700900222"),
            new Seed(
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                "Sofia", "Rossi", "sofia.rossi@kinevor.demo", "+447700900331",
                new DateTime(1998, 12, 21, 0, 0, 0, DateTimeKind.Utc), Gender.Female,
                61.2, 172, false, null,
                "22 Shoreditch High Street", null, "London", null, "United Kingdom", "E1 6JJ",
                "Marco Rossi", "+447700900332"),
            new Seed(
                Guid.Parse("44444444-4444-4444-4444-444444444444"),
                "Liam", "Chen", "liam.chen@kinevor.demo", "+447700900441",
                new DateTime(1987, 2, 8, 0, 0, 0, DateTimeKind.Utc), Gender.Male,
                79.8, 176, false, null,
                "5 Canada Square", null, "London", null, "United Kingdom", "E14 5AB",
                "Grace Chen", "+447700900442"),
            new Seed(
                Guid.Parse("55555555-5555-5555-5555-555555555555"),
                "Amina", "Yusuf", "amina.yusuf@kinevor.demo", "+447700900551",
                new DateTime(1992, 7, 30, 0, 0, 0, DateTimeKind.Utc), Gender.Female,
                57.9, 163, false, null,
                "31 Borough High Street", null, "London", null, "United Kingdom", "SE1 1NA",
                "Hassan Yusuf", "+447700900552"),
        };

        var checkIns = new[] { 42, 18, 7, 63, 25 };
        var lastVisits = new[] { 2, 1, 35, 0, 5 };
        var members = new List<Member>();
        foreach (var seed in seeds)
        {
            var created = Member.Create(
                now,
                members.Count + 1,
                seed.FirstName, seed.LastName, seed.Email, seed.Phone,
                seed.DateOfBirth, seed.Gender, seed.WeightKg, seed.HeightCm,
                seed.MedicalNotes, seed.HasMedicalConditions,
                seed.AddressLine1, seed.AddressLine2, seed.City, seed.State,
                seed.Country, seed.PostalCode,
                seed.EmergencyContactName, seed.EmergencyContactPhone);

            if (created.IsFailure)
                throw new InvalidOperationException(created.Error.Message);

            var member = created.Value;
            for (var visit = 0; visit < checkIns[members.Count]; visit++)
                member.RecordCheckIn(now.AddDays(-lastVisits[members.Count]));

            db.Members.Add(member);
            db.Entry(member).Property(item => item.Id).CurrentValue = seed.Id;
            members.Add(member);
        }

        var frozen = members[2].Freeze("Travel", now.AddDays(18), now);
        if (frozen.IsFailure)
            throw new InvalidOperationException(frozen.Error.Message);

        await db.SaveChangesAsync(ct);

        for (var index = 0; index < members.Count; index++)
        {
            var joined = db.Entry(members[index]).Property(item => item.CreatedAt);
            joined.CurrentValue = now.AddMonths(-10 + index);
            joined.IsModified = true;
        }

        await db.SaveChangesAsync(ct);

        var progress = new[]
        {
            (members[0], ProgressKind.Weight, (string?)null, (double?)68.4, "kg", "Morning weigh-in.", now.AddDays(-21)),
            (members[0], ProgressKind.Measurement, (string?)"Waist", (double?)74.5, "cm", "Relaxed measurement.", now.AddDays(-14)),
            (members[0], ProgressKind.PersonalRecord, (string?)"Back squat", (double?)95, "kg", "Three clean reps.", now.AddDays(-7)),
            (members[0], ProgressKind.Weight, (string?)null, (double?)67.6, "kg", "Down 0.8 kg this month.", now.AddDays(-1)),
            (members[1], ProgressKind.PersonalRecord, (string?)"Deadlift", (double?)150, "kg", "New personal best.", now.AddDays(-10)),
            (members[4], ProgressKind.Weight, (string?)null, (double?)57.9, "kg", "Baseline.", now.AddDays(-30)),
        };

        foreach (var entry in progress)
        {
            var createdEntry = ProgressEntry.Create(
                entry.Item1.Id, entry.Item2, entry.Item3, entry.Item4, entry.Item5, entry.Item6, entry.Item7, now);
            if (createdEntry.IsFailure)
                throw new InvalidOperationException(createdEntry.Error.Message);
            db.ProgressEntries.Add(createdEntry.Value);
        }

        foreach (var key in new[] { ConsentKeys.HealthData, ConsentKeys.Marketing, ConsentKeys.Analytics })
            db.Consents.Add(MemberConsent.Grant(
                PrimaryMemberId, key, ConsentKeys.CurrentVersion, "en", "demo", now.AddDays(-90)));

        db.Consents.Add(MemberConsent.Grant(
            members[1].Id, ConsentKeys.HealthData, ConsentKeys.CurrentVersion, "en", "demo", now.AddDays(-120)));

        var device = MemberDevice.Create(
            PrimaryMemberId, "demo-ios-device-token-000000000001", "ios");
        if (device.IsFailure)
            throw new InvalidOperationException(device.Error.Message);
        db.Devices.Add(device.Value);

        await db.SaveChangesAsync(ct);
    }

    private sealed record Seed(
        Guid Id,
        string FirstName,
        string LastName,
        string Email,
        string Phone,
        DateTime DateOfBirth,
        Gender Gender,
        double? WeightKg,
        double? HeightCm,
        bool HasMedicalConditions,
        string? MedicalNotes,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string? State,
        string Country,
        string PostalCode,
        string? EmergencyContactName,
        string? EmergencyContactPhone);
}
