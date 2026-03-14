<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PantryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_id',
        'created_by',
        'name',
        'quantity_current',
        'quantity_min',
        'unit',
        'category',
    ];

    protected $casts = [
        'quantity_current' => 'decimal:2',
        'quantity_min' => 'decimal:2',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
