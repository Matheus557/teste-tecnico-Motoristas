<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nome'])]
class Motorista extends Model
{
    use HasFactory;

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }
}
