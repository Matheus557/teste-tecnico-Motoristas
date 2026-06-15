<?php

namespace App\Http\Controllers;

use App\Models\Motorista;
use App\Models\Pedido;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PedidoController extends Controller
{
    public function index(Motorista $motorista, Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 10);

        if (! in_array($perPage, [10, 20, 30], true)) {
            $perPage = 10;
        }

        $period = $this->periodFromRequest($request);

        $pedidos = $motorista->pedidos()
            ->select(['id', 'codigo', 'endereco', 'status'])
            ->when(
                $period,
                fn ($query) => $query->whereBetween('solicitado_em', $period),
            )
            ->orderBy('id')
            ->paginate($perPage)
            ->through(fn (Pedido $pedido) => [
                'id' => $pedido->id,
                'codigo' => $pedido->codigo,
                'endereco' => $pedido->endereco,
                'status' => $pedido->status,
            ]);

        return response()->json($pedidos);
    }

    public function update(Motorista $motorista, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pedidos' => ['required', 'array'],
            'pedidos.*.id' => [
                'required',
                'integer',
                Rule::exists('pedidos', 'id')->where('motorista_id', $motorista->id),
            ],
            'pedidos.*.endereco' => ['required', 'string', 'max:255'],
            'pedidos.*.status' => [
                'required',
                Rule::in([Pedido::STATUS_PENDENTE, Pedido::STATUS_ENTREGUE]),
            ],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['pedidos'] as $pedido) {
                $pedidoModel = Pedido::query()->findOrFail($pedido['id']);
                $entregueEm = $pedidoModel->entregue_em;

                if ($pedido['status'] === Pedido::STATUS_ENTREGUE && $entregueEm === null) {
                    $entregueEm = now();
                }

                if ($pedido['status'] === Pedido::STATUS_PENDENTE) {
                    $entregueEm = null;
                }

                $pedidoModel->update([
                    'endereco' => $pedido['endereco'],
                    'status' => $pedido['status'],
                    'entregue_em' => $entregueEm,
                ]);
            }
        });

        return response()->json([
            'message' => 'Pedidos atualizados com sucesso.',
        ]);
    }

    public function entregas(Motorista $motorista, Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 10);

        if (! in_array($perPage, [10, 20, 30], true)) {
            $perPage = 10;
        }

        $period = $this->periodFromRequest($request);

        $entregas = $motorista->pedidos()
            ->select(['id', 'codigo', 'endereco', 'entregue_em'])
            ->where('status', Pedido::STATUS_ENTREGUE)
            ->when(
                $period,
                fn ($query) => $query->whereBetween('solicitado_em', $period),
            )
            ->orderByDesc('entregue_em')
            ->orderBy('id')
            ->paginate($perPage)
            ->through(fn (Pedido $pedido) => [
                'id' => $pedido->id,
                'codigo' => $pedido->codigo,
                'endereco' => $pedido->endereco,
                'entregue_em' => $pedido->entregue_em instanceof Carbon
                    ? $pedido->entregue_em->format('d/m/Y H:i')
                    : null,
            ]);

        return response()->json($entregas);
    }

    public function updateEntregas(Motorista $motorista, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entregas' => ['required', 'array'],
            'entregas.*.id' => [
                'required',
                'integer',
                Rule::exists('pedidos', 'id')
                    ->where('motorista_id', $motorista->id)
                    ->where('status', Pedido::STATUS_ENTREGUE),
            ],
            'entregas.*.endereco' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($validated): void {
            foreach ($validated['entregas'] as $entrega) {
                Pedido::query()
                    ->whereKey($entrega['id'])
                    ->where('status', Pedido::STATUS_ENTREGUE)
                    ->update([
                        'endereco' => $entrega['endereco'],
                    ]);
            }
        });

        return response()->json([
            'message' => 'Entregas atualizadas com sucesso.',
        ]);
    }

    /**
     * @return array<int, Carbon>|null
     */
    private function periodFromRequest(Request $request): ?array
    {
        $dateStart = $request->date('date_start');
        $dateEnd = $request->date('date_end');

        if (! $dateStart || ! $dateEnd) {
            return null;
        }

        return [
            $dateStart->copy()->startOfDay(),
            $dateEnd->copy()->endOfDay(),
        ];
    }
}
