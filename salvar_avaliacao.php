<?php
// Define o caminho do arquivo onde será salvo
$arquivo = 'avaliacoes.csv';

// Lê os dados recebidos em JSON
$dadosJson = file_get_contents('php://input');
$dados = json_decode($dadosJson, true);

// Verifica se veio algo válido
if (!$dados || !isset($dados['nomeIdeia'])) {
    http_response_code(400);
    echo json_encode(['erro' => 'Dados inválidos']);
    exit;
}

// Abre (ou cria) o arquivo CSV no modo de adicionar
$fp = fopen($arquivo, 'a');

// Cria a linha de dados
$linha = [
    $dados['nomeIdeia'],
    $dados['respostas']['problema_real'],
    $dados['respostas']['compraria'],
    $dados['respostas']['valor_outros'],
    $dados['respostas']['facilidade_implantacao'],
    $dados['respostas']['potencial_escala'],
    $dados['data']
];

// Salva a linha
fputcsv($fp, $linha, ';');

// Fecha o arquivo
fclose($fp);

// Retorna sucesso
echo json_encode(['status' => 'ok']);
