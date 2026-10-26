using Kinevor.Modules.Members.Application;
using Kinevor.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Members.EntityFrameworkCore;

/// <summary>EF Core member repository.</summary>
public sealed class MemberRepository(MembersDbContext db) : IMemberRepository
{
    /// <summary>Finds a member by id.</summary>
    public Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Members.FirstOrDefaultAsync(member => member.Id == id, ct);

    /// <summary>Finds a member by normalized e-mail.</summary>
    public async Task<Member?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var normalized = (email ?? string.Empty).Trim().ToLowerInvariant();
        var members = await db.Members.ToListAsync(ct);
        return members.FirstOrDefault(member =>
            string.Equals(member.Email.Value, normalized, StringComparison.Ordinal));
    }

    /// <summary>Searches members in memory so the e-mail value object stays provider-independent.</summary>
    public async Task<(IReadOnlyList<Member> Items, int Total)> SearchAsync(
        string? search, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var members = await db.Members.AsNoTracking().ToListAsync(ct);
        IEnumerable<Member> query = members;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(member =>
                member.FullName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                member.Email.Value.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                member.MemberNumber.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (Enum.TryParse<MemberStatus>(status, true, out var parsed))
            query = query.Where(member => member.Status == parsed);

        var ordered = query.OrderByDescending(member => member.CreatedAt).ToList();
        var items = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return (items, ordered.Count);
    }

    /// <summary>Returns the next sequence for the year.</summary>
    public async Task<int> GetYearSequenceAsync(int year, CancellationToken ct = default)
    {
        var prefix = $"KZN-{year}-";
        var count = await db.Members.CountAsync(member => member.MemberNumber.StartsWith(prefix), ct);
        return count + 1;
    }

    /// <summary>Tracks a new member.</summary>
    public void Add(Member member) => db.Members.Add(member);

    /// <summary>Marks a member as modified.</summary>
    public void Update(Member member) => db.Members.Update(member);
}

/// <summary>EF Core progress, consent and device repository.</summary>
public sealed class MemberEngagementRepository(MembersDbContext db) : IMemberEngagementRepository
{
    /// <summary>Lists progress entries in a date range.</summary>
    public async Task<IReadOnlyList<ProgressEntry>> GetProgressAsync(
        Guid memberId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = db.ProgressEntries.Where(entry => entry.MemberId == memberId);
        if (from is { } start) query = query.Where(entry => entry.RecordedAt >= start);
        if (to is { } end) query = query.Where(entry => entry.RecordedAt <= end);

        return await query.AsNoTracking()
            .OrderByDescending(entry => entry.RecordedAt)
            .ToListAsync(ct);
    }

    /// <summary>Tracks a new progress entry.</summary>
    public Task AddProgressAsync(ProgressEntry entry, CancellationToken ct = default)
    {
        db.ProgressEntries.Add(entry);
        return Task.CompletedTask;
    }

    /// <summary>Lists consent history.</summary>
    public async Task<IReadOnlyList<MemberConsent>> GetConsentsAsync(
        Guid memberId, CancellationToken ct = default) =>
        await db.Consents.AsNoTracking()
            .Where(consent => consent.MemberId == memberId)
            .OrderBy(consent => consent.Key)
            .ToListAsync(ct);

    /// <summary>Finds one consent by member and key.</summary>
    public Task<MemberConsent?> GetConsentAsync(
        Guid memberId, string key, CancellationToken ct = default)
    {
        var normalized = (key ?? string.Empty).Trim().ToLowerInvariant();
        return db.Consents.FirstOrDefaultAsync(
            consent => consent.MemberId == memberId && consent.Key == normalized, ct);
    }

    /// <summary>Tracks a new consent.</summary>
    public Task AddConsentAsync(MemberConsent consent, CancellationToken ct = default)
    {
        db.Consents.Add(consent);
        return Task.CompletedTask;
    }

    /// <summary>Marks a consent as modified.</summary>
    public void UpdateConsent(MemberConsent consent) => db.Consents.Update(consent);

    /// <summary>Lists devices.</summary>
    public async Task<IReadOnlyList<MemberDevice>> GetDevicesAsync(
        Guid memberId, CancellationToken ct = default) =>
        await db.Devices.AsNoTracking()
            .Where(device => device.MemberId == memberId)
            .OrderByDescending(device => device.CreatedAt)
            .ToListAsync(ct);

    /// <summary>Finds a device by exact token.</summary>
    public Task<MemberDevice?> GetDeviceAsync(
        Guid memberId, string token, CancellationToken ct = default) =>
        db.Devices.FirstOrDefaultAsync(
            device => device.MemberId == memberId && device.Token == token, ct);

    /// <summary>Tracks a new device.</summary>
    public Task AddDeviceAsync(MemberDevice device, CancellationToken ct = default)
    {
        db.Devices.Add(device);
        return Task.CompletedTask;
    }

    /// <summary>Removes a device.</summary>
    public void RemoveDevice(MemberDevice device) => db.Devices.Remove(device);

    /// <summary>Deletes progress entries and devices for erasure.</summary>
    public async Task PurgeAsync(Guid memberId, CancellationToken ct = default)
    {
        await db.ProgressEntries.Where(entry => entry.MemberId == memberId).ExecuteDeleteAsync(ct);
        await db.Devices.Where(device => device.MemberId == memberId).ExecuteDeleteAsync(ct);
    }
}
