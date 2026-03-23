<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            // Rastreia qual parcela está pendente/atual.
            // Parcelas < installment_current foram pagas; a atual = installment_current.
            $table->unsignedSmallInteger('installment_current')
                ->default(1)
                ->after('installments_total')
                ->comment('1-based index da parcela atual pendente (para dívidas parceladas)');
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->dropColumn('installment_current');
        });
    }
};
