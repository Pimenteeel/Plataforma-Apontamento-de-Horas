## Passo a passo para iniciar o servidor:
1. cd backend
2. Criação do Ambiente Virtual
    Remove-Item -Recurse -Force venv 
    python -m venv venv
    py -m pip install -r requirements.txt
3. .\venv\Scripts\Activate.ps1 (ativar o ambiente virtual)
4. Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process (liberar acesso ao venv)
5. py src/server.py