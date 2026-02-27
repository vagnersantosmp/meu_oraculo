import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://bdimmbdxaurihlxnhcvy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkaW1tYmR4YXVyaWhseG5oY3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzIzNjYsImV4cCI6MjA4NzIwODM2Nn0.JOuQ2i2VSXvDPJcM2IKfyoeJ_54wFJxQMVBovf8FJnA'
);

const produtos = [
    // Mercearia
    { nome_produto: 'Arroz', categoria: 'Mercearia' },
    { nome_produto: 'Feijão', categoria: 'Mercearia' },
    { nome_produto: 'Macarrão', categoria: 'Mercearia' },
    { nome_produto: 'Farinha de trigo', categoria: 'Mercearia' },
    { nome_produto: 'Farinha de mandioca', categoria: 'Mercearia' },
    { nome_produto: 'Açúcar', categoria: 'Mercearia' },
    { nome_produto: 'Sal', categoria: 'Mercearia' },
    { nome_produto: 'Óleo de soja', categoria: 'Mercearia' },
    { nome_produto: 'Azeite de oliva', categoria: 'Mercearia' },
    { nome_produto: 'Café', categoria: 'Mercearia' },
    { nome_produto: 'Achocolatado', categoria: 'Mercearia' },
    { nome_produto: 'Leite condensado', categoria: 'Mercearia' },
    { nome_produto: 'Creme de leite', categoria: 'Mercearia' },
    { nome_produto: 'Molho de tomate', categoria: 'Mercearia' },
    { nome_produto: 'Milho em conserva', categoria: 'Mercearia' },
    { nome_produto: 'Ervilha em conserva', categoria: 'Mercearia' },
    { nome_produto: 'Atum em lata', categoria: 'Mercearia' },
    { nome_produto: 'Sardinha em lata', categoria: 'Mercearia' },
    { nome_produto: 'Aveia', categoria: 'Mercearia' },
    { nome_produto: 'Granola', categoria: 'Mercearia' },
    { nome_produto: 'Biscoito cream cracker', categoria: 'Mercearia' },
    { nome_produto: 'Biscoito recheado', categoria: 'Mercearia' },
    { nome_produto: 'Cereal matinal', categoria: 'Mercearia' },
    { nome_produto: 'Gelatina', categoria: 'Mercearia' },
    { nome_produto: 'Amendoim', categoria: 'Mercearia' },
    { nome_produto: 'Pipoca', categoria: 'Mercearia' },
    { nome_produto: 'Vinagre', categoria: 'Mercearia' },
    { nome_produto: 'Amido de milho', categoria: 'Mercearia' },

    // Laticínios
    { nome_produto: 'Leite integral', categoria: 'Laticínios' },
    { nome_produto: 'Leite desnatado', categoria: 'Laticínios' },
    { nome_produto: 'Iogurte natural', categoria: 'Laticínios' },
    { nome_produto: 'Iogurte grego', categoria: 'Laticínios' },
    { nome_produto: 'Bebida láctea', categoria: 'Laticínios' },
    { nome_produto: 'Manteiga', categoria: 'Laticínios' },
    { nome_produto: 'Margarina', categoria: 'Laticínios' },
    { nome_produto: 'Requeijão', categoria: 'Laticínios' },
    { nome_produto: 'Cream cheese', categoria: 'Laticínios' },
    { nome_produto: 'Leite em pó', categoria: 'Laticínios' },
    { nome_produto: 'Creme de leite fresco', categoria: 'Laticínios' },
    { nome_produto: 'Nata', categoria: 'Laticínios' },

    // Frios
    { nome_produto: 'Queijo mussarela', categoria: 'Frios' },
    { nome_produto: 'Queijo prato', categoria: 'Frios' },
    { nome_produto: 'Queijo minas', categoria: 'Frios' },
    { nome_produto: 'Queijo parmesão', categoria: 'Frios' },
    { nome_produto: 'Presunto', categoria: 'Frios' },
    { nome_produto: 'Mortadela', categoria: 'Frios' },
    { nome_produto: 'Peito de peru', categoria: 'Frios' },
    { nome_produto: 'Salame', categoria: 'Frios' },
    { nome_produto: 'Apresuntado', categoria: 'Frios' },
    { nome_produto: 'Queijo coalho', categoria: 'Frios' },

    // Carnes
    { nome_produto: 'Frango inteiro', categoria: 'Carnes' },
    { nome_produto: 'Peito de frango', categoria: 'Carnes' },
    { nome_produto: 'Coxa e sobrecoxa', categoria: 'Carnes' },
    { nome_produto: 'Carne moída', categoria: 'Carnes' },
    { nome_produto: 'Alcatra', categoria: 'Carnes' },
    { nome_produto: 'Picanha', categoria: 'Carnes' },
    { nome_produto: 'Costela', categoria: 'Carnes' },
    { nome_produto: 'Linguiça', categoria: 'Carnes' },
    { nome_produto: 'Salsicha', categoria: 'Carnes' },
    { nome_produto: 'Bacon', categoria: 'Carnes' },
    { nome_produto: 'Carne de porco', categoria: 'Carnes' },
    { nome_produto: 'Filé de peixe', categoria: 'Carnes' },

    // Hortifrúti
    { nome_produto: 'Banana', categoria: 'Hortifrúti' },
    { nome_produto: 'Maçã', categoria: 'Hortifrúti' },
    { nome_produto: 'Laranja', categoria: 'Hortifrúti' },
    { nome_produto: 'Limão', categoria: 'Hortifrúti' },
    { nome_produto: 'Manga', categoria: 'Hortifrúti' },
    { nome_produto: 'Uva', categoria: 'Hortifrúti' },
    { nome_produto: 'Mamão', categoria: 'Hortifrúti' },
    { nome_produto: 'Melancia', categoria: 'Hortifrúti' },
    { nome_produto: 'Abacaxi', categoria: 'Hortifrúti' },
    { nome_produto: 'Morango', categoria: 'Hortifrúti' },
    { nome_produto: 'Tomate', categoria: 'Hortifrúti' },
    { nome_produto: 'Cebola', categoria: 'Hortifrúti' },
    { nome_produto: 'Alho', categoria: 'Hortifrúti' },
    { nome_produto: 'Batata', categoria: 'Hortifrúti' },
    { nome_produto: 'Cenoura', categoria: 'Hortifrúti' },
    { nome_produto: 'Alface', categoria: 'Hortifrúti' },
    { nome_produto: 'Brócolis', categoria: 'Hortifrúti' },
    { nome_produto: 'Couve', categoria: 'Hortifrúti' },
    { nome_produto: 'Pepino', categoria: 'Hortifrúti' },
    { nome_produto: 'Pimentão', categoria: 'Hortifrúti' },

    // Padaria
    { nome_produto: 'Pão francês', categoria: 'Padaria' },
    { nome_produto: 'Pão de forma', categoria: 'Padaria' },
    { nome_produto: 'Pão integral', categoria: 'Padaria' },
    { nome_produto: 'Bolo pronto', categoria: 'Padaria' },
    { nome_produto: 'Torrada', categoria: 'Padaria' },
    { nome_produto: 'Bisnaguinha', categoria: 'Padaria' },
    { nome_produto: 'Pão de queijo', categoria: 'Padaria' },
    { nome_produto: 'Croissant', categoria: 'Padaria' },

    // Bebidas
    { nome_produto: 'Água mineral', categoria: 'Bebidas' },
    { nome_produto: 'Refrigerante', categoria: 'Bebidas' },
    { nome_produto: 'Suco de caixinha', categoria: 'Bebidas' },
    { nome_produto: 'Suco natural', categoria: 'Bebidas' },
    { nome_produto: 'Chá gelado', categoria: 'Bebidas' },
    { nome_produto: 'Cerveja', categoria: 'Bebidas' },
    { nome_produto: 'Vinho', categoria: 'Bebidas' },
    { nome_produto: 'Energético', categoria: 'Bebidas' },
    { nome_produto: 'Água de coco', categoria: 'Bebidas' },
    { nome_produto: 'Isotônico', categoria: 'Bebidas' },
    { nome_produto: 'Refrigerante zero', categoria: 'Bebidas' },
    { nome_produto: 'Chá sachê', categoria: 'Bebidas' },

    // Limpeza
    { nome_produto: 'Detergente', categoria: 'Limpeza' },
    { nome_produto: 'Sabão em pó', categoria: 'Limpeza' },
    { nome_produto: 'Sabão líquido', categoria: 'Limpeza' },
    { nome_produto: 'Amaciante', categoria: 'Limpeza' },
    { nome_produto: 'Água sanitária', categoria: 'Limpeza' },
    { nome_produto: 'Desinfetante', categoria: 'Limpeza' },
    { nome_produto: 'Esponja', categoria: 'Limpeza' },
    { nome_produto: 'Papel toalha', categoria: 'Limpeza' },
    { nome_produto: 'Saco de lixo', categoria: 'Limpeza' },
    { nome_produto: 'Limpador multiuso', categoria: 'Limpeza' },
    { nome_produto: 'Álcool', categoria: 'Limpeza' },
    { nome_produto: 'Pano de chão', categoria: 'Limpeza' },
    { nome_produto: 'Lustra móveis', categoria: 'Limpeza' },
    { nome_produto: 'Limpa vidros', categoria: 'Limpeza' },

    // Higiene
    { nome_produto: 'Papel higiênico', categoria: 'Higiene' },
    { nome_produto: 'Sabonete', categoria: 'Higiene' },
    { nome_produto: 'Shampoo', categoria: 'Higiene' },
    { nome_produto: 'Condicionador', categoria: 'Higiene' },
    { nome_produto: 'Creme dental', categoria: 'Higiene' },
    { nome_produto: 'Escova de dente', categoria: 'Higiene' },
    { nome_produto: 'Desodorante', categoria: 'Higiene' },
    { nome_produto: 'Absorvente', categoria: 'Higiene' },
    { nome_produto: 'Fralda descartável', categoria: 'Higiene' },
    { nome_produto: 'Algodão', categoria: 'Higiene' },
    { nome_produto: 'Hastes flexíveis', categoria: 'Higiene' },
    { nome_produto: 'Protetor solar', categoria: 'Higiene' },
    { nome_produto: 'Creme hidratante', categoria: 'Higiene' },
    { nome_produto: 'Lâmina de barbear', categoria: 'Higiene' },

    // Congelados
    { nome_produto: 'Pizza congelada', categoria: 'Congelados' },
    { nome_produto: 'Lasanha congelada', categoria: 'Congelados' },
    { nome_produto: 'Hambúrguer', categoria: 'Congelados' },
    { nome_produto: 'Nuggets', categoria: 'Congelados' },
    { nome_produto: 'Batata frita congelada', categoria: 'Congelados' },
    { nome_produto: 'Sorvete', categoria: 'Congelados' },
    { nome_produto: 'Açaí', categoria: 'Congelados' },
    { nome_produto: 'Polpa de frutas', categoria: 'Congelados' },

    // Temperos
    { nome_produto: 'Pimenta do reino', categoria: 'Temperos' },
    { nome_produto: 'Colorau', categoria: 'Temperos' },
    { nome_produto: 'Orégano', categoria: 'Temperos' },
    { nome_produto: 'Salsinha desidratada', categoria: 'Temperos' },
    { nome_produto: 'Cominho', categoria: 'Temperos' },
    { nome_produto: 'Tempero pronto', categoria: 'Temperos' },
    { nome_produto: 'Caldo de galinha', categoria: 'Temperos' },
    { nome_produto: 'Canela', categoria: 'Temperos' },
    { nome_produto: 'Louro', categoria: 'Temperos' },
    { nome_produto: 'Curry', categoria: 'Temperos' },

    // Petshop
    { nome_produto: 'Ração para cachorro', categoria: 'Petshop' },
    { nome_produto: 'Ração para gato', categoria: 'Petshop' },
    { nome_produto: 'Areia para gato', categoria: 'Petshop' },
    { nome_produto: 'Petisco para cachorro', categoria: 'Petshop' },
    { nome_produto: 'Sachê para gato', categoria: 'Petshop' },
    { nome_produto: 'Antipulgas', categoria: 'Petshop' },
];

async function seed() {
    console.log(`Inserindo ${produtos.length} produtos...`);

    // Insert in batches of 50
    for (let i = 0; i < produtos.length; i += 50) {
        const batch = produtos.slice(i, i + 50);
        const { error } = await supabase
            .from('product_catalog')
            .upsert(batch, { onConflict: 'lower(trim(nome_produto))' });

        if (error) {
            console.error(`Erro no lote ${i / 50 + 1}:`, error.message);
            // Try one by one for this batch
            for (const p of batch) {
                const { error: singleError } = await supabase
                    .from('product_catalog')
                    .insert(p);
                if (singleError && singleError.code !== '23505') {
                    console.error(`  Erro: ${p.nome_produto} - ${singleError.message}`);
                }
            }
        } else {
            console.log(`  Lote ${i / 50 + 1}: ${batch.length} produtos OK`);
        }
    }

    // Verify
    const { data, error: countError } = await supabase
        .from('product_catalog')
        .select('id', { count: 'exact' });
    if (countError) {
        console.error('Erro ao verificar:', countError.message);
    } else {
        console.log(`\n✅ Total de produtos no catálogo: ${data?.length}`);
    }
}

seed();
