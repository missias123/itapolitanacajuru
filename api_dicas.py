#!/usr/bin/env python3
"""
API de Gerenciamento de Dicas - Sorveteria Itapolitana
Este script fornece endpoints para adicionar, editar, remover e listar dicas.
"""

from flask import Flask, jsonify, request
import json
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# Caminho do arquivo de dados
DATA_DIR = Path(__file__).parent / 'data'
DICAS_FILE = DATA_DIR / 'dicas.json'

# Garantir que o diretório de dados existe
DATA_DIR.mkdir(exist_ok=True)

# Função para carregar dicas do arquivo JSON
def carregar_dicas():
    if DICAS_FILE.exists():
        with open(DICAS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'dicas': []}

# Função para salvar dicas no arquivo JSON
def salvar_dicas(dados):
    with open(DICAS_FILE, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

# Função para obter o próximo ID disponível
def obter_proximo_id():
    dados = carregar_dicas()
    if not dados['dicas']:
        return 1
    return max([dica['id'] for dica in dados['dicas']]) + 1

# CORS - Permitir requisições de qualquer origem (seguro para uso local)
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    return response

# Endpoint para listar todas as dicas
@app.route('/api/dicas', methods=['GET'])
def listar_dicas():
    dados = carregar_dicas()
    return jsonify(dados), 200

# Endpoint para adicionar uma nova dica
@app.route('/api/dicas', methods=['POST'])
def adicionar_dica():
    try:
        dados_json = request.get_json()
        
        if not dados_json or 'titulo' not in dados_json or 'conteudo' not in dados_json:
            return jsonify({'erro': 'Título e conteúdo são obrigatórios'}), 400
        
        dados = carregar_dicas()
        
        nova_dica = {
            'id': obter_proximo_id(),
            'titulo': dados_json['titulo'].strip(),
            'conteudo': dados_json['conteudo'].strip(),
            'data_criacao': datetime.now().isoformat()
        }
        
        dados['dicas'].append(nova_dica)
        salvar_dicas(dados)
        
        return jsonify({'mensagem': 'Dica adicionada com sucesso', 'dica': nova_dica}), 201
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

# Endpoint para obter uma dica específica
@app.route('/api/dicas/<int:dica_id>', methods=['GET'])
def obter_dica(dica_id):
    dados = carregar_dicas()
    
    for dica in dados['dicas']:
        if dica['id'] == dica_id:
            return jsonify(dica), 200
    
    return jsonify({'erro': 'Dica não encontrada'}), 404

# Endpoint para atualizar uma dica
@app.route('/api/dicas/<int:dica_id>', methods=['PUT'])
def atualizar_dica(dica_id):
    try:
        dados_json = request.get_json()
        dados = carregar_dicas()
        
        for i, dica in enumerate(dados['dicas']):
            if dica['id'] == dica_id:
                if 'titulo' in dados_json:
                    dica['titulo'] = dados_json['titulo'].strip()
                if 'conteudo' in dados_json:
                    dica['conteudo'] = dados_json['conteudo'].strip()
                
                dica['data_atualizacao'] = datetime.now().isoformat()
                salvar_dicas(dados)
                
                return jsonify({'mensagem': 'Dica atualizada com sucesso', 'dica': dica}), 200
        
        return jsonify({'erro': 'Dica não encontrada'}), 404
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

# Endpoint para deletar uma dica
@app.route('/api/dicas/<int:dica_id>', methods=['DELETE'])
def deletar_dica(dica_id):
    try:
        dados = carregar_dicas()
        
        for i, dica in enumerate(dados['dicas']):
            if dica['id'] == dica_id:
                dados['dicas'].pop(i)
                salvar_dicas(dados)
                
                return jsonify({'mensagem': 'Dica removida com sucesso'}), 200
        
        return jsonify({'erro': 'Dica não encontrada'}), 404
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

# Endpoint de health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'mensagem': 'API de Dicas está funcionando'}), 200

if __name__ == '__main__':
    # Executar em modo desenvolvimento
    print("🍦 API de Dicas - Sorveteria Itapolitana iniciada!")
    print("Acesse: http://localhost:5000/api/dicas")
    app.run(debug=True, host='0.0.0.0', port=5000)
