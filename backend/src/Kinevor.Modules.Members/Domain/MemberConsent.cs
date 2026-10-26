using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Members.Domain;

/// <summary>Current state of one consent key for a member.</summary>
public sealed class MemberConsent : Entity
{
    private MemberConsent()
    {
    }

    /// <summary>Member who granted or withdrew the consent.</summary>
    public Guid MemberId { get; private set; }

    /// <summary>Stable consent key such as <c>health_data</c>.</summary>
    public string Key { get; private set; } = string.Empty;

    /// <summary>Policy version accepted by the member.</summary>
    public string Version { get; private set; } = string.Empty;

    /// <summary>Whether the consent is currently granted.</summary>
    public bool IsGranted { get; private set; }

    /// <summary>When the consent was first granted.</summary>
    public DateTime GrantedAt { get; private set; }

    /// <summary>When the consent was withdrawn, if ever.</summary>
    public DateTime? WithdrawnAt { get; private set; }

    /// <summary>Culture used when the consent copy was shown.</summary>
    public string Culture { get; private set; } = "en";

    /// <summary>Origin of the consent record.</summary>
    public string Source { get; private set; } = "self-service";

    /// <summary>Creates a granted consent.</summary>
    public static MemberConsent Grant(Guid memberId, string key, string version, string culture, string source, DateTime now)
    {
        return new MemberConsent
        {
            MemberId = memberId,
            Key = key.Trim().ToLowerInvariant(),
            Version = version.Trim(),
            IsGranted = true,
            GrantedAt = now,
            Culture = culture,
            Source = source,
        };
    }

    /// <summary>Withdraws a granted consent.</summary>
    public void Withdraw(DateTime now)
    {
        IsGranted = false;
        WithdrawnAt = now;
    }

    /// <summary>Re-grants a withdrawn consent under the current policy version.</summary>
    public void ReGrant(string version, string culture, string source, DateTime now)
    {
        IsGranted = true;
        Version = version.Trim();
        GrantedAt = now;
        WithdrawnAt = null;
        Culture = culture;
        Source = source;
    }
}
