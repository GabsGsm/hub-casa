<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {       
        // Remover colunas recurring e day_of_month
        Schema::table('payment_cycles', function (Blueprint $table) {
            $table->dropColumn(['recurring', 'day_of_month']);
        });
    }

    public function down(): void
    {
        Schema::table('payment_cycles', function (Blueprint $table) {
            $table->unsignedTinyInteger('day_of_month')->nullable();
            $table->boolean('recurring')->default(true);
        });
    }
};
