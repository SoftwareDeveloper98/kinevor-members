using Kinevor.Modules.Members.Application;
using Microsoft.Extensions.DependencyInjection;

namespace Kinevor.Modules.Members.DependencyInjection;

/// <summary>Registers the members application services.</summary>
public static class MembersModule
{
    /// <summary>Adds MediatR handlers and the system clock.</summary>
    public static IServiceCollection AddMembersModule(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddMediatR(configuration =>
            configuration.RegisterServicesFromAssemblyContaining<GetMembersHandler>());
        services.AddSingleton(TimeProvider.System);
        return services;
    }
}
