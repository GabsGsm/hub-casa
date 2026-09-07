<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gasto extends Model
{
    use HasFactory;

    protected $table = 'gastos';

    // Status possíveis
    public const STATUS_ABERTO = 'aberto';
    public const STATUS_PAGO = 'pago';
    public const STATUS_IMPOSSIBILITADO = 'impossibilitado';

    protected $fillable = [
        'casa_id',
        'ciclo_id',
        'categoria_id',
        'criado_por',
        'titulo',
        'valor',
        'status',
        'vencimento',
        'recorrente',
        'dia_recorrencia',
        'observacoes',
        'parent_gasto_id',
        'mes_referencia',
    ];

    protected $casts = [
        'valor'           => 'decimal:2',
        'vencimento'      => 'date',
        'mes_referencia'  => 'date',
        'recorrente'      => 'boolean',
        'dia_recorrencia' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relacionamentos
    // -------------------------------------------------------------------------

    public function casa(): BelongsTo
    {
        return $this->belongsTo(House::class, 'casa_id');
    }

    public function ciclo(): BelongsTo
    {
        return $this->belongsTo(PaymentCycle::class, 'ciclo_id');
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'categoria_id');
    }

    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function responsaveis(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'gasto_usuario', 'gasto_id', 'user_id');
    }

    public function membrosValor(): HasMany
    {
        return $this->hasMany(GastoMembroValor::class);
    }

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_gasto_id');
    }

    public function instancias(): HasMany
    {
        return $this->hasMany(self::class, 'parent_gasto_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function estaPago(): bool
    {
        return $this->status === self::STATUS_PAGO;
    }

    public function estaAberto(): bool
    {
        return $this->status === self::STATUS_ABERTO;
    }
}