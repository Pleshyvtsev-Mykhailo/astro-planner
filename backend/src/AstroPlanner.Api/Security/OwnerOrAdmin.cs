using AstroPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using System.Globalization;

namespace AstroPlanner.Api.Security;

public class OwnerOrAdminRequirement : IAuthorizationRequirement { }

public class ObservationOwnerHandler : AuthorizationHandler<OwnerOrAdminRequirement, ObservationLog>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OwnerOrAdminRequirement requirement,
        ObservationLog resource)
    {
        var isAdmin = context.User.IsInRole("Admin");
        var isOwner = context.User.FindFirst("sub")?.Value == resource.UserId.ToString(CultureInfo.InvariantCulture);

        if (isAdmin || isOwner)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}