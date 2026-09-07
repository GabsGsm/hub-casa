<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Valor de cada membro em um gasto
        Schema::create('gasto_membro_valor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gasto_id')->constrained('gastos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('valor', 12, 2);
            $table->string('status')->default('pendente')
                ->comment('pendente | pago | impossibilitado');
            $table->foreignId('ciclo_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->timestamps();

            $table->index('gasto_id');
            $table->index('user_id');
        });

        // Valor de cada membro em uma parcela
        Schema::create('parcela_membro_valor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcela_id')->constrained('parcelas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('valor', 12, 2);
            $table->string('status')->default('pendente')
                ->comment('pendente | pago | impossibilitado');
            $table->foreignId('ciclo_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->timestamps();

            $table->index('parcela_id');
            $table->index('user_id');
        });

        // Valor de cada membro em um parcelamento (grupo)
        Schema::create('parcelamento_membro_valor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcelamento_id')->constrained('parcelamentos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('valor', 12, 2);
            $table->string('status')->default('pendente')
                ->comment('pendente | pago | impossibilitado');
            $table->foreignId('ciclo_id')->nullable()->constrained('payment_cycles')->nullOnDelete();
            $table->timestamps();

            $table->index('parcelamento_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcelamento_membro_valor');
        Schema::dropIfExists('parcela_membro_valor');
        Schema::dropIfExists('gasto_membro_valor');
    }
};
