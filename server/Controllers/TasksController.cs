using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NuGet.Protocol;
using server.Data;

namespace server.Models
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly UserDbContext _context;

        public TasksController(UserDbContext context)
        {
            _context = context;
        }

        // GET: api/Tasks
        [HttpGet]
        [Authorize]
        public async Task<ActionResult> GetTasks()
        {

            var currentUsername = GetCurrentUser();
            if (currentUsername.IsNullOrEmpty())
                return BadRequest("Failed to verify current user");

            try
            {
                var curUser = await _context.Users.FirstAsync(o => o.Username == currentUsername);
                var tasks =  (from user in _context.Users
                             join task in _context.Tasks
                             on user.UserId equals task.User_Id.UserId
                             where user.UserId == curUser.UserId
                             select new
                             {
                                 Id = task.Id,
                                 TaskText = task.TaskText,
                                 isTaskActive = task.isTaskActive
                             });

                return Ok(tasks.ToJson());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.HelpLink);
            }
        }

        //PUT: api/Tasks/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutTasksModel(int id, TaskModelDTO taskDTO)
        {
            if (id != taskDTO.Id)
                return NotFound();

            var currentUsername = GetCurrentUser();

            if (currentUsername.IsNullOrEmpty())
                return BadRequest("Failed to verify current user");

            var curUser = await _context.Users.FirstAsync(o => o.Username == currentUsername);
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
                return NotFound();

            if (curUser.UserId != task.User_Id?.UserId)
                return Unauthorized("Failed to authorize action");


            task.TaskText = taskDTO.TaskText;
            task.isTaskActive = taskDTO.isTaskActive;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) when (!TasksModelExists(id))
            {
                return NotFound();
            }

            return NoContent();
        }

        // POST: api/Tasks
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        [Authorize]
        public async Task<ActionResult> PostTasksModel(TaskModelDTO taskDTO)
        {
            var currentUsername = GetCurrentUser();
            if (currentUsername.IsNullOrEmpty())
                return BadRequest("Failed to verify current user");

            var user_id = await _context.Users.FirstAsync(o => o.Username == currentUsername);
            var Task = new TasksModel
            {
                TaskText = taskDTO.TaskText,
                isTaskActive = taskDTO.isTaskActive,
                User_Id = user_id
            };
            _context.Tasks.Add(Task);
            try
            {
                await _context.SaveChangesAsync();
                await _context.Entry(Task).GetDatabaseValuesAsync();
                return Ok(Task.Id);
            }
            catch (DbUpdateConcurrencyException)
            {
                return NotFound();
            }
        }

        // DELETE: api/Tasks/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTasksModel(int id)
        {
            var currentUsername = GetCurrentUser();
            if (currentUsername.IsNullOrEmpty())
            {
                return BadRequest("Failed to verify current user");
            }

            var curUser = await _context.Users.FirstAsync(o => o.Username == currentUsername);
            var tasksModel = await _context.Tasks.FindAsync(id);

            if (tasksModel == null)
            {
                return NotFound();
            }

            if (curUser.UserId != tasksModel.User_Id?.UserId)
            {
                return Unauthorized("Failed to authorize action");
            }


            _context.Tasks.Remove(tasksModel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Tasks
        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteAllTasksModel()
        {
            var currentUsername = GetCurrentUser();
            if (currentUsername.IsNullOrEmpty())
            {
                return BadRequest("Failed to verify user");
            }
            
            var curUser = await _context.Users.FirstAsync(o => o.Username == currentUsername);

            _context.Tasks.RemoveRange(_context.Tasks.Where(o => o.User_Id.UserId == curUser.UserId));
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TasksModelExists(int id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }

        private string GetCurrentUser()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;

            if (identity == null)
                return null;

            var userClaims = identity.Claims;
            return userClaims.FirstOrDefault(o => o.Type == ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
