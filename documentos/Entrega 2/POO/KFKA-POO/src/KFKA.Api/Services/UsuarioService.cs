using KFKA.Api.Data;
using KFKA.Api.Domain;
using KFKA.Api.Domain.Usuarios;
using KFKA.Api.Dtos;
using KFKA.Api.Infra;
using KFKA.Api.Infra.Seguranca;
using Microsoft.EntityFrameworkCore;

namespace KFKA.Api.Services
{
    // Cadastro de administradores, professores e responsáveis.
    public class UsuarioService
    {
        private readonly KfkaDbContext _db;
        private readonly IHasherSenha _hasher;
        private readonly IRelogio _relogio;

        public UsuarioService(KfkaDbContext db, IHasherSenha hasher, IRelogio relogio)
        {
            _db = db;
            _hasher = hasher;
            _relogio = relogio;
        }

        public async Task<List<UsuarioResponse>> ListarAsync(Perfil? perfil, string? busca)
        {
            IQueryable<Usuario> consulta = _db.Usuarios;

            if (perfil != null)
            {
                consulta = consulta.Where(u => u.Perfil == perfil);
            }

            if (!string.IsNullOrWhiteSpace(busca))
            {
                string termo = busca.Trim().ToLower();
                consulta = consulta.Where(u => u.Nome.ToLower().Contains(termo) || u.Email.Contains(termo));
            }

            List<Usuario> usuarios = await consulta.OrderBy(u => u.Nome).ToListAsync();

            List<UsuarioResponse> resposta = new List<UsuarioResponse>();
            foreach (Usuario usuario in usuarios)
            {
                resposta.Add(new UsuarioResponse(usuario));
            }
            return resposta;
        }

        public async Task<UsuarioResponse> ObterAsync(int id)
        {
            Usuario usuario = await BuscarUsuarioAsync(id);
            return new UsuarioResponse(usuario);
        }

        public async Task<UsuarioResponse> CriarAdministradorAsync(CriarAdministradorRequest dados)
        {
            await GarantirEmailDisponivelAsync(dados.Email, 0);

            Administrador administrador = new Administrador(dados.Nome, dados.Email, _hasher.Gerar(dados.Senha),
                dados.Cargo, _relogio.Agora());

            _db.Usuarios.Add(administrador);
            await _db.SaveChangesAsync();
            return new UsuarioResponse(administrador);
        }

        public async Task<UsuarioResponse> CriarProfessorAsync(CriarProfessorRequest dados)
        {
            await GarantirEmailDisponivelAsync(dados.Email, 0);

            Professor professor = new Professor(dados.Nome, dados.Email, _hasher.Gerar(dados.Senha),
                dados.Matricula, _relogio.Agora());

            bool matriculaEmUso = await _db.Professores.AnyAsync(p => p.Matricula == professor.Matricula);
            if (matriculaEmUso)
            {
                throw new ConflitoException("Já existe um professor com esta matrícula.");
            }

            _db.Usuarios.Add(professor);
            await _db.SaveChangesAsync();
            return new UsuarioResponse(professor);
        }

        public async Task<UsuarioResponse> CriarResponsavelAsync(CriarResponsavelRequest dados)
        {
            await GarantirEmailDisponivelAsync(dados.Email, 0);

            Responsavel responsavel = new Responsavel(dados.Nome, dados.Email, _hasher.Gerar(dados.Senha),
                dados.Cpf, dados.Telefone, _relogio.Agora());

            bool cpfEmUso = await _db.Responsaveis.AnyAsync(r => r.Cpf == responsavel.Cpf);
            if (cpfEmUso)
            {
                throw new ConflitoException("Já existe um responsável com este CPF.");
            }

            _db.Usuarios.Add(responsavel);
            await _db.SaveChangesAsync();
            return new UsuarioResponse(responsavel);
        }

        public async Task<UsuarioResponse> AtualizarAsync(int id, AtualizarUsuarioRequest dados)
        {
            Usuario usuario = await BuscarUsuarioAsync(id);
            await GarantirEmailDisponivelAsync(dados.Email, id);

            usuario.AtualizarDados(dados.Nome, dados.Email);
            await _db.SaveChangesAsync();
            return new UsuarioResponse(usuario);
        }

        public async Task<UsuarioResponse> AlterarSituacaoAsync(int id, bool ativo, int administradorLogadoId)
        {
            if (id == administradorLogadoId && !ativo)
            {
                throw new RegraNegocioException("O administrador não pode desativar o próprio usuário.");
            }

            Usuario usuario = await BuscarUsuarioAsync(id);
            if (ativo)
            {
                usuario.Ativar();
            }
            else
            {
                usuario.Desativar();
            }

            await _db.SaveChangesAsync();
            return new UsuarioResponse(usuario);
        }

        private async Task<Usuario> BuscarUsuarioAsync(int id)
        {
            Usuario? usuario = await _db.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                throw new NaoEncontradoException("Usuário não encontrado.");
            }
            return usuario;
        }

        // idIgnorado: na edição, o próprio usuário pode manter o e-mail dele.
        private async Task GarantirEmailDisponivelAsync(string email, int idIgnorado)
        {
            string normalizado = email.Trim().ToLower();
            bool emUso = await _db.Usuarios.AnyAsync(u => u.Email == normalizado && u.Id != idIgnorado);
            if (emUso)
            {
                throw new ConflitoException("Já existe um usuário com este e-mail.");
            }
        }
    }
}
