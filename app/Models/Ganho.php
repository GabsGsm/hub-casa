<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ganho extends Model
{
    use HasFactory;

    protected $table = 'ganhos';

    // Status possíveis
    public const STATUS_ABERTO = 'aberto';
    public const STATUS_PAGO = 'pago';
    public const STATUS_IMPOSSIBILITADO = 'impossibilitado';

    protected $fillable = [
        'casa_id',
        'categoria_id',
        'criado_por',
        'titulo',
        'valor',
        'status',
        'data_recebimento',
        'observacoes',
    ];

    protected $casts = [
        'valor'            => 'decimal:2',
        'data_recebimento' => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function casa(): BelongsTo
    {
        return $this->belongsTo(House::class, 'casa_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoria_id');
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function foiRecebido(): bool
    {
        return $this->status === self::STATUS_PAGO;
    }

    public function estaAberto(): bool
    {
        return $this->status === self::STATUS_ABERTO;
    }
}