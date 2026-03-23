<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Etapa A — adicionar colunas novas (idempotente: verifica existência antes)
        Schema::table('financial_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('financial_transactions', 'is_recurring')) {
                $table->boolean('is_recurring')->default(false)->after('status');
            }
            if (! Schema::hasColumn('financial_transactions', 'recurrence_day')) {
                $table->unsignedTinyInteger('recurrence_day')->nullable()->after('is_recurring');
            }
            if (! Schema::hasColumn('financial_transactions', 'installments_total')) {
                $table->unsignedTinyInteger('installments_total')->nullable()->after('installments_count');
            }
            if (! Schema::hasColumn('financial_transactions', 'installment_amount')) {
                $table->decimal('installment_amount', 10, 2)->nullable()->after('installments_total');
            }
            if (! Schema::hasColumn('financial_transactions', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

        // Etapa B — migrar dados (MySQL)
        DB::statement("
            UPDATE financial_transactions
            SET installments_total = installments_count
            WHERE installments_count IS NOT NULL
        ");

        DB::statement("
            UPDATE financial_transactions
            SET is_recurring = 1,
                recurrence_day = DAY(COALESCE(due_date, DATE(created_at)))
            WHERE recurrence = 'mensal'
        ");

        DB::statement("
            UPDATE financial_transactions
            SET type = 'gasto'
            WHERE type IN ('emprestimo', 'afiado')
        ");

        // Etapa C — remover colunas obsoletas (idempotente)
        Schema::table('financial_transactions', function (Blueprint $table) {
            $toDrop = [];
            foreach (['recurrence', 'installments_count', 'last_installment_date'] as $col) {
                if (Schema::hasColumn('financial_transactions', $col)) {
                    $toDrop[] = $col;
                }
            }
            if (! empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->unsignedInteger('installments_count')->nullable();
            $table->date('last_installment_date')->nullable();
            $table->string('recurrence')->nullable();
        });

        DB::statement("
            UPDATE financial_transactions
            SET installments_count = installments_total
            WHERE installments_total IS NOT NULL
        ");

        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurrence_day', 'installments_total', 'installment_amount', 'notes']);
        });
    }
};
