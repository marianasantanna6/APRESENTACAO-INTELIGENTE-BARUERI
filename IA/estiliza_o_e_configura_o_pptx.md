{
  "metadados_padrao": {
    "instituicao": "Prefeitura de Barueri",
    "secretaria": "Secretaria de Inovação e Tecnologia",
    "marcas_associadas": [
      "Inovação Barueri",
      "TV Inovação Barueri",
      "ONU BR / ODS"
    ],
    "dimensoes_slide": {
      "largura_px": 1280,
      "altura_px": 720,
      "proporcao": "16:9",
      "dpi_exportacao": 150
    },
    "paleta_cores": {
      "fundo_primario": "#05082A",
      "fundo_secundario": "#0A1230",
      "azul_navy": "#0A1F5C",
      "azul_medio": "#1460A8",
      "azul_eletrico": "#1E90FF",
      "verde_teal": "#00A99D",
      "amarelo_destaque": "#F5C518",
      "laranja_acento": "#F5A623",
      "vermelho_acento": "#E84B3A",
      "branco_titulo": "#FFFFFF",
      "branco_suave": "#E8EDF5",
      "cinza_texto": "#B0BAC8",
      "amarelo_texto": "#FFD700"
    },
    "barra_inferior_ods": {
      "uso": "Presente nos slides de conteúdo; ausente na capa, referências e encerramento.",
      "ods_icons_url_placeholder": "ods_goals_strip.png",
      "logos_adicionais": [
        "onubr.png",
        "2030_agenda.png"
      ]
    },
    "tipografia": {
      "fonte_titulo": {
        "familia": "Montserrat",
        "fallback": "Impact",
        "peso": "Black",
        "peso_numerico": 900,
        "transform": "uppercase",
        "cor_padrao": "#FFFFFF"
      },
      "fonte_subtitulo": {
        "familia": "Montserrat",
        "fallback": "Arial",
        "peso": "Bold",
        "peso_numerico": 700,
        "cor_padrao": "#E8EDF5"
      },
      "fonte_corpo": {
        "familia": "Montserrat",
        "fallback": "Arial",
        "peso": "Regular",
        "peso_numerico": 400,
        "cor_padrao": "#B0BAC8"
      },
      "fonte_kpi_numero": {
        "familia": "Montserrat",
        "fallback": "Impact",
        "peso": "ExtraBold",
        "peso_numerico": 800,
        "cor_padrao": "#FFFFFF",
        "tamanho_minimo_pt": 36,
        "tamanho_maximo_pt": 80
      }
    },
    "versao_guia_visual": "1.1",
    "politica_de_dados": "Não usar KPIs municipais predefinidos; todo dado factual precisa ser fornecido e citado por fonte."
  },
  "regras_de_conteudo_e_concisao": {
    "principios_gerais": [
      "Cada slide comunica UMA ideia principal. Se houver dois temas distintos, dividir em dois slides.",
      "Dados quantitativos têm prioridade sobre texto descritivo — um número grande vale mais que um parágrafo.",
      "Todo slide de conteúdo deve ter pelo menos uma âncora visual (foto, gráfico, ícone ou screenshot).",
      "Texto de apoio: até 35 palavras por bloco, em até 3 linhas sempre que o layout permitir."
    ],
    "titulos": {
      "estilo": "UPPERCASE obrigatório",
      "max_caracteres": 50,
      "max_linhas": 2,
      "regra_limite_por_layout": "O limite geral se aplica quando o elemento de título do layout não define max_chars; quando define, vale o menor dos dois limites. O título da apresentação usa o limite do título_principal da capa.",
      "regra_hierarquia": "Título da seção sempre barra superior; subtítulo 'Pilar N:' abaixo do título."
    },
    "kpis_e_estatisticas": {
      "formato_prefixo": [
        "+",
        ""
      ],
      "formato_sufixo_exemplos": [
        "km",
        "famílias",
        "pontos",
        "mil",
        "unidades",
        "%"
      ],
      "max_kpis_por_slide": 3,
      "label_kpi_max_palavras": 4,
      "destaque_numerico": true
    },
    "bullet_points": {
      "max_por_slide": 4,
      "max_palavras_por_item": 8,
      "marcador": "•",
      "evitar": [
        "frases longas",
        "sub-bullets",
        "parágrafos disfarçados de bullets"
      ]
    },
    "imagens": {
      "preferencia": "Fotos reais de equipamentos, pessoas ou locais de Barueri",
      "cobertura_minima": "40% da área do slide deve ter elemento visual",
      "qualidade_minima_px": "800x500",
      "posicao_padrao": "esquerda (col 1 de 2) ou fundo completo com overlay escuro"
    },
    "qr_codes": {
      "quando_usar": "Somente quando há URL pública do recurso mencionado",
      "tamanho_px": 120,
      "posicao": "inferior-direito do bloco de conteúdo relevante",
      "legenda_max_chars": 30
    },
    "texto_de_apoio_max_palavras": 35
  },
  "sequencia_narrativa_padrao": [
    {
      "posicao": 1,
      "tipo_layout": "capa",
      "proposito": "Identidade institucional e tema da apresentação",
      "obrigatorio": true
    },
    {
      "posicao": 2,
      "tipo_layout": "dados_municipio",
      "proposito": "Credibilidade — dados geográficos, populacionais e índices de Barueri",
      "obrigatorio": false,
      "conteudo_esperado": [
        "Área km²",
        "Nº de bairros",
        "IDH",
        "Orçamento",
        "Nº de secretarias"
      ],
      "condicao": "Incluir apenas se fontes fornecidas apresentarem indicadores municipais verificáveis."
    },
    {
      "posicao": "3..N-2",
      "tipo_layout": "ciclo_secao_conteudo",
      "proposito": "Um bloco por pilar/tema: 1 slide divisor + 2..4 slides de conteúdo",
      "obrigatorio": true,
      "padrao_interno": [
        "divisor_secao",
        "conteudo_com_metrica",
        "conteudo_com_metrica",
        "conteudo_com_metrica (opcional)"
      ]
    },
    {
      "posicao": "N-2",
      "tipo_layout": "reconhecimento",
      "proposito": "Prêmios e reconhecimentos citados em fontes — opcional.",
      "obrigatorio": false
    },
    {
      "posicao": "N-1",
      "tipo_layout": "referencias",
      "proposito": "Referências completas das fontes citadas nos slides.",
      "obrigatorio": true
    },
    {
      "posicao": "N",
      "tipo_layout": "encerramento",
      "proposito": "Agradecimento e contato do secretário responsável",
      "obrigatorio": true
    }
  ],
  "catalogo_de_layouts": {
    "capa": {
      "descricao": "Slide de abertura com identidade institucional de Barueri",
      "uso": "Slide 1 sempre",
      "fundo": {
        "tipo": "foto_full_bleed",
        "opcoes": [
          "skyline Barueri",
          "vista aérea da cidade",
          "foto satélite Terra"
        ],
        "overlay": "gradiente escuro rgba(5,8,42,0.65) sobre a foto"
      },
      "elementos": [
        {
          "id": "pre_titulo",
          "tipo": "texto",
          "conteudo": "PREFEITURA DE",
          "tamanho_pt": 28,
          "peso": "Bold",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 38
          }
        },
        {
          "id": "titulo_principal",
          "tipo": "texto",
          "conteudo": "[NOME BARUERI OU TEMA]",
          "tamanho_pt": 72,
          "peso": "Black",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 46
          },
          "max_chars": 30
        },
        {
          "id": "subtitulo",
          "tipo": "texto",
          "conteudo": "[Tema da apresentação em frase completa]",
          "tamanho_pt": 18,
          "peso": "Medium",
          "cor": "#E8EDF5",
          "posicao": {
            "x_pct": 5,
            "y_pct": 64
          },
          "max_chars": 70
        },
        {
          "id": "descricao_curta",
          "tipo": "texto",
          "conteudo": "[1 frase de propósito — máx 20 palavras]",
          "tamanho_pt": 14,
          "peso": "Regular",
          "cor": "#B0BAC8",
          "posicao": {
            "x_pct": 5,
            "y_pct": 72
          }
        },
        {
          "id": "bandeiras",
          "tipo": "imagem",
          "conteudo": [
            "bandeira_brasil.png",
            "bandeira_sp.png"
          ],
          "posicao": {
            "x_pct": 88,
            "y_pct": 2
          },
          "tamanho_px": {
            "w": 80,
            "h": 50
          }
        },
        {
          "id": "barra_logos",
          "tipo": "barra_logos_inferior",
          "posicao": "bottom",
          "logos": [
            "prefeitura_barueri.png",
            "sit.png",
            "inovacao_barueri.png",
            "tv_inovacao.png"
          ],
          "separador_ods": true
        }
      ]
    },
    "dados_municipio": {
      "descricao": "Visão rápida dos indicadores do município para estabelecer credibilidade",
      "uso": "Opcional; usar apenas quando as fontes citadas sustentarem indicadores oficiais de Barueri.",
      "fundo": {
        "tipo": "foto_full_bleed",
        "opcoes": [
          "foto aérea Barueri",
          "foto satélite Terra"
        ],
        "overlay": "rgba(5,8,42,0.70)"
      },
      "elementos": [
        {
          "id": "watermark_nome",
          "tipo": "texto_marca_dagua",
          "conteudo": "BARUERI",
          "tamanho_pt": 120,
          "cor": "rgba(255,255,255,0.06)",
          "posicao": {
            "x_pct": 15,
            "y_pct": 25
          }
        },
        {
          "id": "badges_kpi",
          "tipo": "grade_badges",
          "layout": "horizontal_centrado",
          "max_badges": 3,
          "badge_template": {
            "forma": "circulo",
            "fundo_cor": "rgba(20,96,168,0.70)",
            "borda_cor": "#1E90FF",
            "numero_tamanho_pt": 28,
            "numero_cor": "#FFFFFF",
            "label_tamanho_pt": 11,
            "label_cor": "#B0BAC8"
          },
          "fonte_obrigatoria": true
        },
        {
          "id": "subtitulo_slide",
          "tipo": "texto",
          "conteudo": "[Subtítulo factual fornecido pelas fontes]",
          "tamanho_pt": 16,
          "peso": "Bold",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 80
          }
        },
        {
          "id": "barra_logos_ods",
          "tipo": "barra_logos_inferior",
          "inclui_ods": true
        }
      ]
    },
    "divisor_secao": {
      "descricao": "Slide de transição entre pilares/temas; apresenta o próximo bloco",
      "uso": "Primeiro slide de cada pilar/seção temática",
      "fundo": {
        "tipo": "foto_full_bleed",
        "opcoes": [
          "pessoa com óculos VR",
          "skyline tecnológico",
          "equipamento hi-tech"
        ],
        "overlay": "rgba(5,8,42,0.72)"
      },
      "elementos": [
        {
          "id": "logos_topo",
          "tipo": "barra_logos_superior",
          "logos": [
            "prefeitura_barueri.png",
            "sit.png"
          ],
          "posicao": {
            "x_pct": 2,
            "y_pct": 2
          }
        },
        {
          "id": "logos_topo_direita",
          "tipo": "barra_logos_superior_direita",
          "logos": [
            "inovacao_barueri.png",
            "tv_inovacao.png"
          ],
          "posicao": {
            "x_pct": 78,
            "y_pct": 2
          }
        },
        {
          "id": "supertitulo_fantasma",
          "tipo": "texto_marca_dagua",
          "conteudo": "TRANSFORMAÇÃO DIGITAL",
          "tamanho_pt": 44,
          "cor": "rgba(100,150,255,0.25)",
          "posicao": {
            "x_pct": 5,
            "y_pct": 30
          },
          "estilo": "italic"
        },
        {
          "id": "titulo_pilar",
          "tipo": "texto",
          "conteudo": "Pilar N: [Nome do Pilar]",
          "tamanho_pt": 34,
          "peso": "Bold",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 48
          }
        },
        {
          "id": "icone_pilar",
          "tipo": "icone_quadrado",
          "fundo_cor": "#1460A8",
          "tamanho_px": 80,
          "posicao": {
            "x_pct": 5,
            "y_pct": 72
          }
        },
        {
          "id": "barra_cor_inferior",
          "tipo": "barra_5_cores",
          "cores": [
            "#0A1F5C",
            "#1460A8",
            "#00A99D",
            "#F5A623",
            "#E84B3A"
          ],
          "altura_pct": 3,
          "posicao": "bottom"
        }
      ]
    },
    "conteudo_com_metrica": {
      "descricao": "Slide de conteúdo padrão: imagem à esquerda, KPI + texto à direita",
      "uso": "Slides de conteúdo dentro de cada seção (2 a 4 por pilar)",
      "fundo": {
        "tipo": "cor_solida",
        "cor": "#05082A"
      },
      "elementos": [
        {
          "id": "header_barra",
          "tipo": "header_secao",
          "layout": "topo_escuro",
          "campos": {
            "nome_secao": {
              "tamanho_pt": 18,
              "peso": "Black",
              "cor": "#FFFFFF",
              "transform": "uppercase"
            },
            "subtitulo_pilar": {
              "tamanho_pt": 12,
              "peso": "Regular",
              "cor": "#B0BAC8"
            },
            "logos": [
              "prefeitura_barueri.png",
              "sit.png",
              "inovacao_barueri.png",
              "tv_inovacao.png"
            ]
          },
          "altura_pct": 14,
          "fundo_cor": "#0A1230"
        },
        {
          "id": "imagem_esquerda",
          "tipo": "foto_ou_screenshot",
          "posicao": {
            "x_pct": 2,
            "y_pct": 16,
            "w_pct": 46,
            "h_pct": 66
          },
          "borda": {
            "cor": "#1460A8",
            "espessura_px": 2
          }
        },
        {
          "id": "topico_titulo",
          "tipo": "texto",
          "posicao": {
            "x_pct": 52,
            "y_pct": 18
          },
          "tamanho_pt": 22,
          "peso": "Bold",
          "cor": "#FFFFFF",
          "max_chars": 30,
          "max_linhas": 2
        },
        {
          "id": "kpi_numero",
          "tipo": "kpi_grande",
          "posicao": {
            "x_pct": 52,
            "y_pct": 38
          },
          "numero_tamanho_pt": 56,
          "numero_cor": "#FFFFFF",
          "label_tamanho_pt": 13,
          "label_cor": "#B0BAC8",
          "label_posicao": "abaixo"
        },
        {
          "id": "icone_kpi",
          "tipo": "icone_pequeno",
          "posicao": {
            "x_pct": 84,
            "y_pct": 38
          },
          "tamanho_px": 36,
          "cor": "#F5C518"
        },
        {
          "id": "descricao_texto",
          "tipo": "texto",
          "posicao": {
            "x_pct": 52,
            "y_pct": 58
          },
          "tamanho_pt": 14,
          "peso": "Regular",
          "cor": "#B0BAC8",
          "max_palavras": 35,
          "max_linhas": 3,
          "destaque_negrito": true
        },
        {
          "id": "qr_code_opcional",
          "tipo": "qr_code",
          "posicao": {
            "x_pct": 84,
            "y_pct": 65
          },
          "tamanho_px": 90,
          "legenda": "Acesse o QR CODE",
          "obrigatorio": false
        },
        {
          "id": "barra_ods_inferior",
          "tipo": "barra_logos_inferior_com_ods",
          "posicao": "bottom",
          "altura_pct": 12
        }
      ]
    },
    "destaque_citacao": {
      "descricao": "Slide de impacto com foto de autoridade e frase de destaque em amarelo",
      "uso": "Uma vez por apresentação, normalmente após dados do município",
      "fundo": {
        "tipo": "foto_full_bleed",
        "opcoes": [
          "prefeito em área verde",
          "autoridade em evento público"
        ],
        "overlay": "gradiente rgba(5,8,42,0.50) da esquerda"
      },
      "elementos": [
        {
          "id": "texto_destaque",
          "tipo": "texto",
          "tamanho_pt": 42,
          "peso": "Black",
          "cor": "#F5C518",
          "transform": "uppercase",
          "posicao": {
            "x_pct": 5,
            "y_pct": 30
          },
          "max_chars": 60,
          "max_linhas": 3
        },
        {
          "id": "subtexto",
          "tipo": "texto",
          "tamanho_pt": 16,
          "peso": "Regular",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 68
          },
          "max_palavras": 15
        },
        {
          "id": "logo_topo_direito",
          "tipo": "logo",
          "logo": "barueri_marca.png",
          "posicao": {
            "x_pct": 86,
            "y_pct": 3
          }
        }
      ]
    },
    "nuvem_de_tags": {
      "descricao": "Slide resumo com lista de tecnologias/serviços em estilo word cloud",
      "uso": "Uma vez por apresentação, geralmente após citação — função: mostrar amplitude",
      "fundo": {
        "tipo": "cor_solida_com_watermark",
        "cor": "#F0F4F8",
        "watermark": {
          "conteudo": "BARUERI",
          "cor": "rgba(0,0,0,0.04)",
          "tamanho_pt": 120
        }
      },
      "elementos": [
        {
          "id": "itens_nuvem",
          "tipo": "word_cloud",
          "regras": {
            "tamanho_maior_pt": 28,
            "tamanho_menor_pt": 11,
            "cores": [
              "#0A1F5C",
              "#1460A8",
              "#1E90FF",
              "#00A99D",
              "#F5A623"
            ],
            "pesos_variaveis": true,
            "max_itens": 25,
            "distribuicao": "aleatoria_controlada"
          }
        },
        {
          "id": "barra_cor_inferior",
          "tipo": "barra_5_cores",
          "cores": [
            "#0A1F5C",
            "#1460A8",
            "#00A99D",
            "#F5A623",
            "#E84B3A"
          ],
          "altura_pct": 4,
          "posicao": "bottom"
        }
      ]
    },
    "visao_geral_infografica": {
      "descricao": "Slide denso estilo infográfico com múltiplas seções, fotos e QR codes",
      "uso": "Slide de encerramento de um pilar complexo ou slide único de tema abrangente (ex: Metaverso)",
      "fundo": {
        "tipo": "cor_solida",
        "cor": "#05082A"
      },
      "elementos": [
        {
          "id": "titulo_grande",
          "tipo": "texto",
          "tamanho_pt": 36,
          "peso": "Black",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 2,
            "y_pct": 2
          }
        },
        {
          "id": "grade_secoes",
          "tipo": "grid_multiplos_blocos",
          "layout": "2x2 ou 3x2",
          "bloco_template": {
            "titulo_bloco_tamanho_pt": 12,
            "titulo_bloco_peso": "Bold",
            "bullets_tamanho_pt": 10,
            "max_bullets": 4,
            "foto_opcional": true,
            "qr_code_opcional": true
          }
        },
        {
          "id": "kpis_destaque",
          "tipo": "grade_numeros",
          "layout": "horizontal",
          "max_kpis": 3,
          "kpi_template": {
            "numero_tamanho_pt": 32,
            "numero_cor": "#FFFFFF",
            "label_tamanho_pt": 11,
            "fundo_cor": "#1460A8",
            "borda": false
          }
        },
        {
          "id": "barra_logos_inferior_completa",
          "tipo": "barra_logos_inferior_com_ods",
          "posicao": "bottom"
        }
      ]
    },
    "mapa_nacional": {
      "descricao": "Mapa do Brasil com marcadores de cidades/parcerias para mostrar alcance",
      "uso": "Opcional — quando o tema envolve alcance nacional ou certificações externas",
      "fundo": {
        "tipo": "cor_solida_com_foto_suave",
        "cor": "#EAEFF5",
        "foto_overlay": "skyline Barueri com baixa opacidade"
      },
      "elementos": [
        {
          "id": "titulo",
          "tipo": "texto",
          "conteudo": "ALCANCE NACIONAL",
          "tamanho_pt": 36,
          "peso": "Black",
          "cor": "#0A1F5C",
          "posicao": {
            "x_pct": 5,
            "y_pct": 5
          }
        },
        {
          "id": "mapa_brasil",
          "tipo": "imagem",
          "posicao": {
            "x_pct": 10,
            "y_pct": 15,
            "w_pct": 80,
            "h_pct": 75
          },
          "descricao": "Mapa vetorial do Brasil com marcadores de pontos"
        },
        {
          "id": "logo_sit",
          "tipo": "logo",
          "posicao": {
            "x_pct": 84,
            "y_pct": 2
          }
        }
      ]
    },
    "reconhecimento": {
      "descricao": "Slide com prêmios e reconhecimentos nacionais e internacionais",
      "uso": "Penúltimo slide (antes do encerramento)",
      "fundo": {
        "tipo": "cor_escura_com_textura",
        "cor": "#05082A"
      },
      "elementos": [
        {
          "id": "titulo",
          "tipo": "texto",
          "conteudo": "RECONHECIMENTO",
          "tamanho_pt": 42,
          "peso": "Black",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 5
          }
        },
        {
          "id": "grade_premios",
          "tipo": "grid_badges",
          "layout": "4 colunas x 2 linhas",
          "badge_template": {
            "icone_trofeu": true,
            "nome_premio_tamanho_pt": 10,
            "descricao_tamanho_pt": 9,
            "fundo_cor": "rgba(20,96,168,0.30)",
            "borda_cor": "#1460A8",
            "max_itens": 8
          },
          "posicao": {
            "x_pct": 2,
            "y_pct": 18,
            "w_pct": 96,
            "h_pct": 76
          }
        }
      ]
    },
    "encerramento": {
      "descricao": "Slide final com agradecimento e informações de contato do secretário",
      "uso": "Último slide, sempre",
      "fundo": {
        "tipo": "foto_full_bleed",
        "opcoes": [
          "smartwatch com display",
          "tecnologia abstrata",
          "cidade noturna"
        ],
        "overlay": "rgba(5,8,42,0.78)"
      },
      "elementos": [
        {
          "id": "titulo_obrigado",
          "tipo": "texto",
          "conteudo": "OBRIGADO",
          "tamanho_pt": 60,
          "peso": "Black",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 35,
            "y_pct": 28
          },
          "alinhamento": "center"
        },
        {
          "id": "bloco_contato",
          "tipo": "card_contato",
          "posicao": {
            "x_pct": 5,
            "y_pct": 62
          },
          "campos": {
            "nome": {
              "tamanho_pt": 16,
              "peso": "Bold",
              "cor": "#FFFFFF"
            },
            "cargo": {
              "tamanho_pt": 12,
              "peso": "Regular",
              "cor": "#B0BAC8"
            },
            "telefone": {
              "tamanho_pt": 11,
              "cor": "#B0BAC8"
            },
            "email": {
              "tamanho_pt": 11,
              "cor": "#B0BAC8"
            },
            "website": {
              "tamanho_pt": 11,
              "cor": "#1E90FF"
            }
          }
        },
        {
          "id": "qr_code_contato",
          "tipo": "qr_code",
          "posicao": {
            "x_pct": 5,
            "y_pct": 55
          },
          "tamanho_px": 100,
          "legenda": "Acesse o QR CODE"
        },
        {
          "id": "logo_prefeitura",
          "tipo": "logo",
          "logo": "prefeitura_barueri.png",
          "posicao": {
            "x_pct": 70,
            "y_pct": 65
          },
          "tamanho_px": 160
        }
      ]
    },
    "referencias": {
      "descricao": "Lista de fontes verificáveis citadas na apresentação.",
      "uso": "Apêndice obrigatório imediatamente antes do encerramento.",
      "fundo": {
        "tipo": "cor_solida",
        "cor": "#05082A"
      },
      "elementos": [
        {
          "id": "titulo",
          "tipo": "texto",
          "conteudo": "REFERÊNCIAS",
          "tamanho_pt": 36,
          "peso": "Black",
          "cor": "#FFFFFF",
          "posicao": {
            "x_pct": 5,
            "y_pct": 5
          }
        },
        {
          "id": "lista_fontes",
          "tipo": "lista_fontes",
          "posicao": {
            "x_pct": 5,
            "y_pct": 18,
            "w_pct": 90,
            "h_pct": 74
          }
        }
      ]
    }
  },
  "diretrizes_para_python_pptx": {
    "configuracao_inicial": {
      "biblioteca": "python-pptx >= 0.6.21",
      "tamanho_apresentacao": {
        "codigo": "prs.slide_width = Inches(13.33); prs.slide_height = Inches(7.5)",
        "equivale_a": "1280x720 @ 96dpi — proporção 16:9"
      },
      "master_slide": "Usar layout em branco (blank) e aplicar todos os elementos manualmente para controle total"
    },
    "cores_como_constantes": {
      "instrucao": "Definir todas as cores como constantes no topo do script usando RGBColor(r, g, b)",
      "exemplo": [
        "COR_FUNDO = RGBColor(5, 8, 42)",
        "COR_TITULO = RGBColor(255, 255, 255)",
        "COR_AMARELO = RGBColor(245, 197, 24)",
        "COR_AZUL_MEDIO = RGBColor(20, 96, 168)",
        "COR_TEXTO_SUAVE = RGBColor(176, 186, 200)"
      ]
    },
    "funcoes_auxiliares_recomendadas": [
      {
        "nome": "add_background_rect(slide, color)",
        "proposito": "Preenche o slide com cor sólida de fundo"
      },
      {
        "nome": "add_text_box(slide, text, x, y, w, h, font_size, bold, color, italic, align)",
        "proposito": "Adiciona caixa de texto com todos os atributos tipográficos definidos"
      },
      {
        "nome": "add_image(slide, image_path, x, y, w, h)",
        "proposito": "Insere imagem sem redimensionamento distorcido"
      },
      {
        "nome": "add_color_bar(slide, colors, y_bottom, height)",
        "proposito": "Gera a barra de 5 cores na parte inferior dos slides divisores"
      },
      {
        "nome": "add_kpi_block(slide, number, unit, label, x, y)",
        "proposito": "Cria um bloco KPI com número grande + label abaixo"
      },
      {
        "nome": "add_logo_strip(slide, logo_paths, y_bottom)",
        "proposito": "Adiciona a barra de logos institucionais na parte inferior"
      }
    ],
    "gestao_de_texto": {
      "instrucao_critica": "Nunca usar o padrão de text_frame.paragraphs[0].runs[0] sem verificar. Sempre limpar o frame e adicionar parágrafos explicitamente.",
      "alinhamento": "Usar PP_ALIGN.LEFT para títulos, PP_ALIGN.CENTER para KPIs",
      "espacamento": "paragraph.space_after = Pt(0) para controle preciso de entrelinhas"
    },
    "imagens_de_fundo": {
      "instrucao": "Adicionar imagens como primeiro elemento do slide (z-index mais baixo), depois sobrepor overlay retangular semitransparente.",
      "overlay_metodo": "Adicionar MSO_THEME_COLOR ou fill.fore_color.rgb com transparência via alpha"
    },
    "barra_ods": {
      "instrucao": "Inserir como imagem PNG pré-renderizada (ods_strip.png) na parte inferior. Dimensões sugeridas: 340x80px. Posicionar à direita na barra de logos."
    },
    "exportacao": {
      "formato": ".pptx",
      "comando_salvar": "prs.save('output/nome_apresentacao.pptx')",
      "pasta_assets": "Manter pasta /assets com: logos, fotos, ods_strip.png, qr_codes/"
    }
  }
}
