using Kinevor.Modules.Members.Domain;

namespace Kinevor.Modules.Members.Application;

/// <summary>Persistence contract for member profiles.</summary>
public interface IMemberRepository
{
    /// <summary>Finds a member by id.</summary>
    Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Finds a member by normalized e-mail.</summary>
    Task<Member?> GetByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>Searches and pages members by name or e-mail and status.</summary>
    Task<(IReadOnlyList<Member> Items, int Total)> SearchAsync(
        string? search, string? status, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Returns the next member-number sequence for the given year.</summary>
    Task<int> GetYearSequenceAsync(int year, CancellationToken ct = default);

    /// <summary>Tracks a new member.</summary>
    void Add(Member member);

    /// <summary>Marks a member as modified.</summary>
    void Update(Member member);
}

/// <summary>Persistence contract for progress, consents and devices.</summary>
public interface IMemberEngagementRepository
{
    /// <summary>Lists progress entries in an optional date range.</summary>
    Task<IReadOnlyList<ProgressEntry>> GetProgressAsync(
        Guid memberId, DateTime? from, DateTime? to, CancellationToken ct = default);

    /// <summary>Tracks a new progress entry.</summary>
    Task AddProgressAsync(ProgressEntry entry, CancellationToken ct = default);

    /// <summary>Lists consent records for a member.</summary>
    Task<IReadOnlyList<MemberConsent>> GetConsentsAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>Finds one consent by key.</summary>
    Task<MemberConsent?> GetConsentAsync(Guid memberId, string key, CancellationToken ct = default);

    /// <summary>Tracks a new consent.</summary>
    Task AddConsentAsync(MemberConsent consent, CancellationToken ct = default);

    /// <summary>Marks a consent as modified.</summary>
    void UpdateConsent(MemberConsent consent);

    /// <summary>Lists registered devices.</summary>
    Task<IReadOnlyList<MemberDevice>> GetDevicesAsync(Guid memberId, CancellationToken ct = default);

    /// <summary>Finds a device by token.</summary>
    Task<MemberDevice?> GetDeviceAsync(Guid memberId, string token, CancellationToken ct = default);

    /// <summary>Tracks a new device.</summary>
    Task AddDeviceAsync(MemberDevice device, CancellationToken ct = default);

    /// <summary>Removes a device.</summary>
    void RemoveDevice(MemberDevice device);

    /// <summary>Deletes progress entries and devices for erasure.</summary>
    Task PurgeAsync(Guid memberId, CancellationToken ct = default);
}

/// <summary>Unit of work owned by the members module.</summary>
public interface IMembersUnitOfWork
{
    /// <summary>Persists pending changes.</summary>
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
