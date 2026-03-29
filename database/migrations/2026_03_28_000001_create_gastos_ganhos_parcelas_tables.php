<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // =====================================================================
        // 1. GASTOS — despesas pontuais ou recorrentes
        // =====================================================================
        Schema::create('gastos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('casa_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('ciclo_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('criado_por')->constrained('users')->cascadeOnDelete();

            $table->string('titulo');
            $table->decimal('valor', 12, 2);
            $table->string('status')->default('aberto');
            $table->date('vencimento')->nullable();

            $table->boolean('recorrente')->default(false);
            $table->unsignedTinyInteger('dia_recorrencia')->nullable()
                ->comment('Dia do mês para lançamento recorrente (1-31)');

            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index(['casa_id', 'status']);
            $table->index(['casa_id', 'ciclo_id']);
        });

        Schema::create('gasto_usuario', function (Blueprint $table) {
            $table->foreignId('gasto_id')->constrained('gastos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['gasto_id', 'user_id']);
        });

        // =====================================================================
        // 2. GANHOS — receitas / entradas pontuais
        // =====================================================================
        Schema::create('ganhos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('casa_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('criado_por')->constrained('users')->cascadeOnDelete();

            $table->string('titulo');
            $table->decimal('valor', 12, 2);
            $table->string('status')->default('aberto');
            $table->date('data_recebimento')->nullable()
                ->comment('Data em que o ganho foi efetivamente recebido');

            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index(['casa_id', 'status']);
        });

        // =====================================================================
        // 3. PARCELAMENTOS (pai) — dados compartilhados do grupo
        // =====================================================================
        Schema::create('parcelamentos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('casa_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('ciclo_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('criado_por')->constrained('users')->cascadeOnDelete();

            $table->string('titulo');
            $table->decimal('valor_total', 12, 2)
                ->comment('Valor total do parcelamento (soma de todas as parcelas)');
            $table->unsignedSmallInteger('total_parcelas');
            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index('casa_id');
        });

        // Tabela pivô: responsáveis pelo parcelamento
        Schema::create('parcelamento_usuario', function (Blueprint $table) {
            $table->foreignId('parcelamento_id')->constrained('parcelamentos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['parcelamento_id', 'user_id']);
        });

        // =====================================================================
        // 4. PARCELAS (filha) — cada parcela individual
        // =====================================================================
        Schema::create('parcelas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('parcelamento_id')->constrained('parcelamentos')->cascadeOnDelete();

            $table->unsignedSmallInteger('numero_parcela')
                ->comment('Número sequencial da parcela (1, 2, 3...)');
            $table->decimal('valor_parcela', 12, 2);
            $table->string('status')->default('aberto');
            $table->date('vencimento');
            $table->timestamps();

            $table->index(['parcelamento_id', 'status']);
            $table->index('vencimento');
        });

        // =====================================================================
        // 5. REMOVER tabelas antigas
        // =====================================================================
        Schema::dropIfExists('financial_transaction_user');
        Schema::dropIfExists('financial_transactions');
    }

    public function down(): void
    {
        Schema::dropIfExists('parcelas');
        Schema::dropIfExists('parcelamento_usuario');
        Schema::dropIfExists('parcelamentos');
        Schema::dropIfExists('ganhos');
        Schema::dropIfExists('gasto_usuario');
        Schema::dropIfExists('gastos');

        // Recriar tabela original (schema simplificado para rollback)
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained('houses')->cascadeOnDelete();
            $table->foreignId('payment_cycle_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->string('type');
            $table->string('status')->default('aberto');
            $table->date('due_date')->nullable();
            $table->boolean('is_recurring')->default(false);
            $table->unsignedTinyInteger('recurrence_day')->nullable();
            $table->unsignedTinyInteger('installments_total')->nullable();
            $table->unsignedSmallInteger('installment_current')->default(1);
            $table->decimal('installment_amount', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('financial_transaction_user', function (Blueprint $table) {
            $table->foreignId('financial_transaction_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['financial_transaction_id', 'user_id']);
        });
    }
};
