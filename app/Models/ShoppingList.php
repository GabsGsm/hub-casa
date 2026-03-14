<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShoppingList extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_id',
        'created_by',
        'name',
        'quantity',
        'unit',
        'status',
        'recurrence',
        'category',
        'priority',
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
