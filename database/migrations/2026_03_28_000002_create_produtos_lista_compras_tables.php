<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // =====================================================================
        // 1. PRODUTOS — cadastro mestre de itens da casa (unifica dispensa)
        // =====================================================================
        Schema::create('produtos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('casa_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('criado_por')->constrained('users')->cascadeOnDelete();

            $table->string('nome', 120);
            $table->string('unidade', 20)->default('un');
            $table->string('categoria', 60)->nullable();
            $table->string('prioridade', 10)->default('normal'); // normal, alta

            // Estoque (dispensa)
            $table->decimal('estoque_atual', 10, 2)->default(0);
            $table->decimal('estoque_minimo', 10, 2)->default(0);

            $table->timestamps();

            $table->index('casa_id');
            $table->index(['casa_id', 'categoria']);
        });

        // =====================================================================
        // 2. LISTA_COMPRAS — itens a comprar, referencia o produto
        // =====================================================================
        Schema::create('lista_compras', function (Blueprint $table) {
            $table->id();

            $table->foreignId('produto_id')->constrained('produtos')->cascadeOnDelete();
            $table->foreignId('criado_por')->constrained('users')->cascadeOnDelete();

            $table->decimal('quantidade_desejada', 10, 2)->default(1)
                ->comment('Quantidade que se deseja comprar');
            $table->decimal('quantidade_comprada', 10, 2)->default(0)
                ->comment('Quantidade já adquirida (compra parcial)');

            $table->string('status', 20)->default('pendente');
            // pendente  = ainda não completou a compra
            // completo  = quantidade_comprada >= quantidade_desejada
            // cancelado = desistiu de comprar

            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index(['produto_id', 'status']);
        });

        // =====================================================================
        // 3. REMOVER tabelas antigas
        // =====================================================================
        Schema::dropIfExists('shopping_lists');
        Schema::dropIfExists('pantry_items');
    }

    public function down(): void
    {
        Schema::dropIfExists('lista_compras');
        Schema::dropIfExists('produtos');

        // Recriar tabelas antigas (simplificado)
        Schema::create('shopping_lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('quantity')->default('1');
            $table->string('unit')->default('un');
            $table->string('status')->default('pendente');
            $table->string('recurrence')->nullable();
            $table->string('category')->nullable();
            $table->string('priority')->default('normal');
            $table->timestamps();
        });

        Schema::create('pantry_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('quantity_current', 10, 2)->default(0);
            $table->decimal('quantity_min', 10, 2)->default(0);
            $table->string('unit')->default('un');
            $table->string('category')->nullable();
            $table->timestamps();
        });
    }
};
