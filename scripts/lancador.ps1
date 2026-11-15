<#
.SYNOPSIS
    Lançador do dia do evento, chamado pelo jogar.bat.

.DESCRIPTION
    Sobe o servidor estático (scripts/servidor.ps1) numa janela de console própria,
    minimizada, e abre o navegador em tela cheia no jogo. Fechar a janela do servidor
    encerra o jogo; fechar o navegador não.

    Porta já ocupada pelo próprio KiwiRun: só reabre o navegador. Ocupada por outro
    programa: avisa e sai com código 1.

    O endereço é sempre http://localhost:<porta> (nunca 127.0.0.1, que é outra origem
    e outro localStorage), e o perfil do navegador é dedicado e persistente.
#>
param(
    [int]$Porta = 47800,
    # Não abre o navegador (usado pelos testes).
    [switch]$SemNavegador
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$RAIZ = Split-Path -Parent $PSScriptRoot
$URL = "http://localhost:$Porta/"
$LIMITE_SUBIDA_MS = 10000

<#
.SYNOPSIS
    Diz quem responde na porta: 'livre', 'kiwirun' ou 'outro'.
#>
function Get-OcupanteDaPorta {
    $ouvintes = [Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners()
    if (-not ($ouvintes | Where-Object { $_.Port -eq $Porta })) { return 'livre' }

    try {
        $pedido = [Net.WebRequest]::Create($URL)
        $pedido.Timeout = 2000
        $resposta = $pedido.GetResponse()
        $ehKiwiRun = $resposta.Headers['X-KiwiRun'] -eq '1'
        $resposta.Close()
    } catch [Net.WebException] {
        $ehKiwiRun = $_.Exception.Response -and $_.Exception.Response.Headers['X-KiwiRun'] -eq '1'
    } catch {
        $ehKiwiRun = $false
    }
    if ($ehKiwiRun) { return 'kiwirun' }
    return 'outro'
}

<#
.SYNOPSIS
    Sobe o servidor numa janela minimizada e espera ele responder.
#>
function Start-Servidor {
    $powershell = (Get-Process -Id $PID).Path
    $servidor = Join-Path $PSScriptRoot 'servidor.ps1'
    $argumentos = "-NoProfile -ExecutionPolicy Bypass -File `"$servidor`" -Raiz `"$RAIZ`" -Porta $Porta"
    $processo = Start-Process -FilePath $powershell -ArgumentList $argumentos -WindowStyle Minimized -PassThru

    $fim = (Get-Date).AddMilliseconds($LIMITE_SUBIDA_MS)
    while ((Get-Date) -lt $fim) {
        if ($processo.HasExited) { break }
        if ((Get-OcupanteDaPorta) -eq 'kiwirun') {
            Write-Host "Servidor iniciado (PID $($processo.Id)) em $URL"
            return
        }
        Start-Sleep -Milliseconds 200
    }
    if (-not $processo.HasExited) { Stop-Process -Id $processo.Id -Force }
    throw "O servidor do KiwiRun não subiu na porta $Porta."
}

<#
.SYNOPSIS
    O executável do navegador: o Edge, ou o Chrome se o Edge faltar. O Brave fica de fora.
#>
function Find-Navegador {
    $candidatos = @(
        @{ Nome = 'edge'; Caminho = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe' }
        @{ Nome = 'edge'; Caminho = Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe' }
        @{ Nome = 'chrome'; Caminho = Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe' }
        @{ Nome = 'chrome'; Caminho = Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe' }
        @{ Nome = 'chrome'; Caminho = Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe' }
    )
    foreach ($candidato in $candidatos) {
        if (Test-Path -LiteralPath $candidato.Caminho) { return $candidato }
    }
    throw 'Nenhum navegador encontrado: instale o Microsoft Edge ou o Google Chrome.'
}

<#
.SYNOPSIS
    Abre o jogo em tela cheia num perfil dedicado e persistente (sem --kiosk, que
    roda em InPrivate e apaga o localStorage).
#>
function Open-Jogo {
    $navegador = Find-Navegador
    $perfil = Join-Path $env:LOCALAPPDATA "KiwiRun\perfil-$($navegador.Nome)"
    $argumentos = @(
        '--start-fullscreen'
        "--user-data-dir=`"$perfil`""
        '--no-first-run'
        '--hide-crash-restore-bubble'
        '--autoplay-policy=no-user-gesture-required'
        $URL
    )
    Start-Process -FilePath $navegador.Caminho -ArgumentList ($argumentos -join ' ')
}

try {
    switch (Get-OcupanteDaPorta) {
        'outro' {
            Write-Host "A porta $Porta está ocupada por outro programa. Feche esse programa e rode o jogar.bat de novo."
            exit 1
        }
        'kiwirun' { Write-Host "O KiwiRun já está no ar em $URL; reabrindo o navegador." }
        'livre' { Start-Servidor }
    }
    if (-not $SemNavegador) { Open-Jogo }
    exit 0
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
    exit 1
}
