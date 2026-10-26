using Kinevor.Modules.Members.Application;
using Microsoft.Extensions.DependencyInjection;

namespace Kinevor.Modules.Members.EntityFrameworkCore;

/// <summary>Registers member persistence services.</summary>
public static class MembersEntityFrameworkCoreExtensions
{
    /// <summary>Adds repositories and the module unit of work.</summary>
    public static IServiceCollection AddMembersEntityFrameworkCore(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IMemberEngagementRepository, MemberEngagementRepository>();
        services.AddScoped<IMembersUnitOfWork>(provider => provider.GetRequiredService<MembersDbContext>());
        return services;
    }
}
