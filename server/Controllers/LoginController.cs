using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using NuGet.Protocol;
using server.Data;
using server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace server.Controllers
{
    [Route("api/")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private IConfiguration _config;
        private readonly UserDbContext _context;

        public LoginController(IConfiguration config, UserDbContext context)
        {
            _config = config;
            _context = context;
        }

        private byte[] generateSalt() => RandomNumberGenerator.GetBytes(128 / 8);

        private string HashPassword(string rawPass, byte[] salt)
        {
            string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: rawPass!,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8));

            return hashed;
        }
        
        [AllowAnonymous]
        [HttpPost("Login")]
        public IActionResult Login([FromBody] UserModel userLogin)
        {
            if (!UserExists(userLogin.Username))
            {
                return NotFound("Username does not exist");
            }

            var user = Authenticate(userLogin);

            if (user == null)
                return BadRequest("Username or password is incorrect");

            var token = GenerateJWT(user);
            return Ok(token.ToJson());
        }

        [AllowAnonymous]
        [HttpPost("Register")]
        public async Task<IActionResult> RegisterAsync([FromBody] UserModel userLogin)
        {
            if (UserExists(userLogin.Username))
                return BadRequest("Username already taken");

            var salt = generateSalt();
            var newUser = new UserModel
            {
                Username = userLogin.Username,
                Password = HashPassword(userLogin.Password, salt),
                Salt = salt
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private string GenerateJWT(UserModel user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Username)
            };

            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
              _config["Jwt:Audience"],
              claims,
              expires: DateTime.Now.AddMonths(12),
              signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private UserModel Authenticate(UserModel userLogin)
        {
            var hashedPass = HashPassword(userLogin.Password, _context.Users.First(o => o.Username == userLogin.Username).Salt);
            var currentUser = _context.Users.FirstOrDefault(o => o.Username.ToLower() == userLogin.Username.ToLower() && o.Password == hashedPass);

            if (currentUser == null)
            {
                return null;
            }

            return currentUser;
        }

        private bool UserExists(string username)
        {
            return _context.Users.Any(e => e.Username.ToLower() == username.ToLower());
        }
    }
}
