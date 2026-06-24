using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class UserController : ControllerBase
	{
		private readonly SignInManager<IdentityUser> _signInManager;
		private readonly UserManager<IdentityUser> _userManager;

		public UserController(
			SignInManager<IdentityUser> signInManager,
			UserManager<IdentityUser> userManager)
		{
			_signInManager = signInManager;
			_userManager = userManager;
		}

		// POST /api/user/login
		[HttpPost("login")]
		public async Task<IActionResult> Login(LoginRequest request)
		{
			var user = await _userManager.FindByEmailAsync(request.Email);
			if (user is null)
			{
				return Unauthorized(new { message = "Invalid email or password." });
			}

			var result = await _signInManager.PasswordSignInAsync(user, request.Password, isPersistent: true, lockoutOnFailure: false);

			if (!result.Succeeded)
			{
				return Unauthorized(new { message = "Invalid email or password." });
			}

			// cookie is now set on the response
			return Ok(new { email = user.Email });
		}

		// POST /api/user/logout
		[HttpPost("logout")]
		[Authorize]
		public async Task<IActionResult> Logout()
		{
			await _signInManager.SignOutAsync();
			return Ok();
		}

		// GET /api/user/me  — the SPA uses this to check "am I logged in?"
		[HttpGet("me")]
		[Authorize]
		public IActionResult Me() => Ok(new { email = User.Identity!.Name });
	}
}
