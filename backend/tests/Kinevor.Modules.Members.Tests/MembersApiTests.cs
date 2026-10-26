using Xunit;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Kinevor.Modules.Members.DemoApi.Data;

namespace Kinevor.Modules.Members.Tests;

/// <summary>HTTP contract for the members module.</summary>
public class MembersApiTests
{
    /// <summary>Staff can list seeded members.</summary>
    [Fact]
    public async Task List_ReturnsSeededMembersForStaff()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/members?page=1&pageSize=10");
        request.Headers.Add("X-Demo-Role", "Staff");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = document.RootElement.GetProperty("data");
        Assert.Equal(5, data.GetProperty("totalCount").GetInt32());
        Assert.Equal(5, data.GetProperty("items").GetArrayLength());
    }

    /// <summary>Members cannot access the staff directory.</summary>
    [Fact]
    public async Task List_ForbidsMembers()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/members");
        request.Headers.Add("X-Demo-Role", "Member");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    /// <summary>Search filters by member number or name.</summary>
    [Fact]
    public async Task List_SearchesByMemberNumber()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(
            HttpMethod.Get, "/api/v1/members?search=KZN-2026-00001");
        request.Headers.Add("X-Demo-Role", "Staff");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(1, document.RootElement.GetProperty("data").GetProperty("totalCount").GetInt32());
    }

    /// <summary>Medical notes stay hidden until the reveal flag is set.</summary>
    [Fact]
    public async Task Detail_MasksHealthUntilRevealed()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        var id = "22222222-2222-2222-2222-222222222222";

        using var maskedRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/members/{id}");
        maskedRequest.Headers.Add("X-Demo-Role", "Staff");
        var masked = await client.SendAsync(maskedRequest);
        using var maskedDocument = JsonDocument.Parse(await masked.Content.ReadAsStringAsync());
        var maskedData = maskedDocument.RootElement.GetProperty("data");
        Assert.Equal("Hidden until revealed", maskedData.GetProperty("medicalNotes").GetString());
        Assert.False(maskedData.GetProperty("revealed").GetBoolean());

        using var revealedRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/members/{id}?reveal=true");
        revealedRequest.Headers.Add("X-Demo-Role", "Staff");
        var revealed = await client.SendAsync(revealedRequest);
        using var revealedDocument = JsonDocument.Parse(await revealed.Content.ReadAsStringAsync());
        var revealedData = revealedDocument.RootElement.GetProperty("data");
        Assert.Contains("asthma", revealedData.GetProperty("medicalNotes").GetString());
        Assert.True(revealedData.GetProperty("revealed").GetBoolean());
    }

    /// <summary>Registering health data requires a health consent.</summary>
    [Fact]
    public async Task Register_RequiresHealthConsent()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        using var request = NewRegistration(hasMedicalConditions: true, includeHealthConsent: false);
        request.Headers.Add("X-Demo-Role", "Staff");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>Registration creates a member with a generated number.</summary>
    [Fact]
    public async Task Register_CreatesMember()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        using var request = NewRegistration(hasMedicalConditions: false, includeHealthConsent: true);
        request.Headers.Add("X-Demo-Role", "Staff");

        var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var id = document.RootElement.GetProperty("data").GetProperty("id").GetGuid();

        using var detailRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/members/{id}");
        detailRequest.Headers.Add("X-Demo-Role", "Staff");
        var detail = await client.SendAsync(detailRequest);
        using var detailDocument = JsonDocument.Parse(await detail.Content.ReadAsStringAsync());
        Assert.StartsWith("KZN-2026-", detailDocument.RootElement.GetProperty("data")
            .GetProperty("memberNumber").GetString());
    }

    /// <summary>Freeze and unfreeze move the member between lifecycle states.</summary>
    [Fact]
    public async Task FreezeAndUnfreeze_ChangesStatus()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        var id = DemoDataSeeder.PrimaryMemberId.ToString();

        using var freeze = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/members/{id}/freeze")
        {
            Content = JsonContent.Create(new { reason = "Travel", frozenUntil = DateTime.UtcNow.AddDays(10) }),
        };
        freeze.Headers.Add("X-Demo-Role", "Staff");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(freeze)).StatusCode);

        using var detail = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/members/{id}");
        detail.Headers.Add("X-Demo-Role", "Staff");
        var detailResponse = await client.SendAsync(detail);
        using var detailDocument = JsonDocument.Parse(await detailResponse.Content.ReadAsStringAsync());
        Assert.Equal("Frozen", detailDocument.RootElement.GetProperty("data").GetProperty("status").GetString());

        using var unfreeze = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/members/{id}/unfreeze");
        unfreeze.Headers.Add("X-Demo-Role", "Staff");
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(unfreeze)).StatusCode);
    }

    /// <summary>The self-service profile requires a linked member claim.</summary>
    [Fact]
    public async Task Me_RequiresLinkedMember()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        using var missing = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me/profile");
        missing.Headers.Add("X-Demo-Role", "Member");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.SendAsync(missing)).StatusCode);

        using var linked = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me/profile");
        linked.Headers.Add("X-Demo-Role", "Member");
        linked.Headers.Add("X-Demo-Member", DemoDataSeeder.PrimaryMemberId.ToString());
        var response = await client.SendAsync(linked);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("maya.thompson@kinevor.demo",
            document.RootElement.GetProperty("data").GetProperty("email").GetString());
    }

    /// <summary>A member can record progress and read it back.</summary>
    [Fact]
    public async Task Progress_CanBeRecordedAndListed()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        using var create = new HttpRequestMessage(HttpMethod.Post, "/api/v1/me/progress")
        {
            Content = JsonContent.Create(new
            {
                kind = "Weight",
                value = 67.1,
                unit = "kg",
                notes = "Morning",
            }),
        };
        create.Headers.Add("X-Demo-Role", "Member");
        create.Headers.Add("X-Demo-Member", DemoDataSeeder.PrimaryMemberId.ToString());
        Assert.Equal(HttpStatusCode.Created, (await client.SendAsync(create)).StatusCode);

        using var list = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me/progress");
        list.Headers.Add("X-Demo-Role", "Member");
        list.Headers.Add("X-Demo-Member", DemoDataSeeder.PrimaryMemberId.ToString());
        var response = await client.SendAsync(list);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Contains(document.RootElement.GetProperty("data").EnumerateArray(),
            item => item.GetProperty("value").GetDouble() == 67.1);
    }

    /// <summary>Consents can be withdrawn and re-granted.</summary>
    [Fact]
    public async Task Consents_CanBeWithdrawnAndRegranted()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();
        var memberId = DemoDataSeeder.PrimaryMemberId.ToString();

        using var withdraw = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/me/consents/marketing");
        withdraw.Headers.Add("X-Demo-Role", "Member");
        withdraw.Headers.Add("X-Demo-Member", memberId);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(withdraw)).StatusCode);

        using var list = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me/consents");
        list.Headers.Add("X-Demo-Role", "Member");
        list.Headers.Add("X-Demo-Member", memberId);
        var response = await client.SendAsync(list);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Contains(document.RootElement.GetProperty("data").EnumerateArray(),
            item => item.GetProperty("key").GetString() == "marketing" &&
                    !item.GetProperty("granted").GetBoolean());

        using var grant = new HttpRequestMessage(HttpMethod.Post, "/api/v1/me/consents/marketing");
        grant.Headers.Add("X-Demo-Role", "Member");
        grant.Headers.Add("X-Demo-Member", memberId);
        Assert.Equal(HttpStatusCode.OK, (await client.SendAsync(grant)).StatusCode);
    }

    /// <summary>Privacy export includes module-owned sections.</summary>
    [Fact]
    public async Task PrivacyExport_ReturnsMemberSections()
    {
        using var factory = new TestWebApplicationFactory();
        using var client = factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/me/privacy/export");
        request.Headers.Add("X-Demo-Role", "Member");
        request.Headers.Add("X-Demo-Member", DemoDataSeeder.PrimaryMemberId.ToString());
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = document.RootElement.GetProperty("data");
        Assert.Equal("Maya", data.GetProperty("profile").GetProperty("firstName").GetString());
        Assert.True(data.GetProperty("progress").GetArrayLength() >= 4);
        Assert.True(data.GetProperty("consents").GetArrayLength() >= 3);
    }

    private static HttpRequestMessage NewRegistration(bool hasMedicalConditions, bool includeHealthConsent)
    {
        var consents = includeHealthConsent
            ? new[] { new { key = "health_data", version = "2026-10", granted = true } }
            : Array.Empty<object>();

        return new HttpRequestMessage(HttpMethod.Post, "/api/v1/members")
        {
            Content = JsonContent.Create(new
            {
                firstName = "Nia",
                lastName = "Bennett",
                email = "nia.bennett@kinevor.demo",
                phone = "+447700900661",
                dateOfBirth = "1996-03-18T00:00:00Z",
                gender = "Female",
                weightKg = 64.2,
                heightCm = 170,
                medicalNotes = hasMedicalConditions ? "Knee injury history." : null,
                hasMedicalConditions,
                addressLine1 = "9 Union Street",
                city = "London",
                country = "United Kingdom",
                postalCode = "SE1 1SD",
                emergencyContactName = "Owen Bennett",
                emergencyContactPhone = "+447700900662",
                consents,
            }),
        };
    }
}
