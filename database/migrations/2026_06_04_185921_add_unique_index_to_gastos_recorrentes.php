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
        // Limpar instâncias duplicadas (registros com parent_gasto_id preenchido)
        // criadas pelo bug de comparação Carbon vs string.
        // Mantém apenas a instância mais recente por (parent_gasto_id, mes_referencia).
        \Illuminate\Support\Facades\DB::statement('
            DELETE g1 FROM gastos g1
            INNER JOIN gastos g2
              ON g1.parent_gasto_id = g2.parent_gasto_id
             AND g1.mes_referencia  = g2.mes_referencia
             AND g1.id > g2.id
        ');

        // Garantir que orphaned gasto_membro_valor sejam removidos
        \Illuminate\Support\Facades\DB::statement('
            DELETE FROM gasto_membro_valor
            WHERE gasto_id NOT IN (SELECT id FROM gastos)
        ');

        // Adicionar unique index para prevenir duplicatas futuras
        Schema::table('gastos', function (Blueprint $table) {
            $table->unique(['parent_gasto_id', 'mes_referencia'], 'gastos_parent_mes_unique');
        });
    }

    public function down(): void
    {
        Schema::table('gastos', function (Blueprint $table) {
            $table->dropUnique('gastos_parent_mes_unique');
        });
    }
};
