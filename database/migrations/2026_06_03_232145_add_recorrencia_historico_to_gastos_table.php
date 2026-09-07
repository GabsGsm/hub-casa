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
        Schema::table('gastos', function (Blueprint $table) {
            // FK para o gasto base da recorrência (NULL = é o próprio gasto base)
            $table->foreignId('parent_gasto_id')
                ->nullable()
                ->after('observacoes')
                ->constrained('gastos')
                ->nullOnDelete()
                ->comment('Gasto base da recorrência; null = este registro é o base');

            // Primeiro dia do mês ao qual esta instância pertence (para deduplicação)
            $table->date('mes_referencia')
                ->nullable()
                ->after('parent_gasto_id')
                ->comment('Data do primeiro dia do mês que esta instância representa (YYYY-MM-01)');

            $table->index(['parent_gasto_id', 'mes_referencia']);
        });
    }

    public function down(): void
    {
        Schema::table('gastos', function (Blueprint $table) {
            $table->dropForeign(['parent_gasto_id']);
            $table->dropIndex(['parent_gasto_id', 'mes_referencia']);
            $table->dropColumn(['parent_gasto_id', 'mes_referencia']);
        });
    }
};
