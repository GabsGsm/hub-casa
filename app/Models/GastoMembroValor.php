<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GastoMembroValor extends Model
{
    protected $table = 'gasto_membro_valor';

    protected $fillable = [
        'gasto_id',
        'user_id',
        'valor',
        'status',
        'ciclo_id',
    ];

    public function gasto(): BelongsTo
    {
        return $this->belongsTo(Gasto::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(PaymentCycle::class, 'ciclo_id');
    }
}
