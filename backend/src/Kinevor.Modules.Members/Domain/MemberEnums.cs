namespace Kinevor.Modules.Members.Domain;

/// <summary>Lifecycle status of a member.</summary>
public enum MemberStatus
{
    /// <summary>Active and eligible to train.</summary>
    Active,

    /// <summary>Temporarily frozen; cannot check in or book.</summary>
    Frozen,

    /// <summary>Suspended by staff for policy reasons.</summary>
    Suspended,

    /// <summary>Membership or account has expired.</summary>
    Expired,
}

/// <summary>Gender captured at registration.</summary>
public enum Gender
{
    /// <summary>Female.</summary>
    Female,

    /// <summary>Male.</summary>
    Male,

    /// <summary>Non-binary.</summary>
    NonBinary,

    /// <summary>Prefer not to say.</summary>
    PreferNotToSay,
}

/// <summary>Kinds of progress entries a member can record.</summary>
public enum ProgressKind
{
    /// <summary>Body weight.</summary>
    Weight,

    /// <summary>Body measurement such as waist or chest.</summary>
    Measurement,

    /// <summary>Personal record for a lift or workout.</summary>
    PersonalRecord,

    /// <summary>Progress photo reference.</summary>
    Photo,
}
