<#
.SYNOPSIS
    Servidor estático do lançador (jogar.bat): serve o jogo em http://localhost:<porta>/.

.DESCRIPTION
    Usa só o que vem no Windows (PowerShell + HttpListener), nada a instalar.
    Roda até a janela ser fechada. Toda resposta leva o cabeçalho X-KiwiRun, que o
    lançador usa para reconhecer o próprio servidor numa porta ocupada.
#>
param(
    [Parameter(Mandatory)][string]$Raiz,
    [Parameter(Mandatory)][int]$Porta
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$TIPOS = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.tmj'  = 'application/json; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.png'  = 'image/png'
    '.ogg'  = 'audio/ogg'
    '.wav'  = 'audio/wav'
}

$raizCompleta = [IO.Path]::GetFullPath($Raiz).TrimEnd('\') + '\'

$ouvinte = New-Object Net.HttpListener
$ouvinte.Prefixes.Add("http://localhost:$Porta/")
$ouvinte.Start()

$Host.UI.RawUI.WindowTitle = 'KiwiRun rodando — feche esta janela para encerrar'
Write-Host "KiwiRun rodando em http://localhost:$Porta/"
Write-Host 'Feche esta janela para encerrar.'

while ($ouvinte.IsListening) {
    $contexto = $ouvinte.GetContext()
    $resposta = $contexto.Response
    try {
        $resposta.AddHeader('X-KiwiRun', '1')
        $resposta.AddHeader('Cache-Control', 'no-cache')

        $caminho = $contexto.Request.Url.LocalPath.TrimStart('/')
        if ($caminho -eq '' -or $caminho.EndsWith('/')) { $caminho += 'index.html' }
        $arquivo = [IO.Path]::GetFullPath((Join-Path $raizCompleta $caminho))

        if (-not $arquivo.StartsWith($raizCompleta, [StringComparison]::OrdinalIgnoreCase)) {
            $resposta.StatusCode = 403
        } elseif (-not [IO.File]::Exists($arquivo)) {
            $resposta.StatusCode = 404
        } else {
            $extensao = [IO.Path]::GetExtension($arquivo).ToLowerInvariant()
            $tipo = $TIPOS[$extensao]
            if (-not $tipo) { $tipo = 'application/octet-stream' }
            $conteudo = [IO.File]::ReadAllBytes($arquivo)
            $resposta.ContentType = $tipo
            $resposta.ContentLength64 = $conteudo.Length
            $resposta.OutputStream.Write($conteudo, 0, $conteudo.Length)
        }
    } catch {
        # Navegador que desiste da conexão no meio não derruba o servidor.
    } finally {
        try { $resposta.Close() } catch { }
    }
}
