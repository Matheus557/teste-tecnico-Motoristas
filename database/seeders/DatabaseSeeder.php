<?php

namespace Database\Seeders;

use App\Models\Motorista;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Usuario Teste',
                'email' => 'test@example.com',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Maria Aprovada',
                'email' => 'maria.aprovada@example.com',
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Joao Pendente',
                'email' => 'joao.pendente@example.com',
                'email_verified_at' => null,
            ],
            [
                'name' => 'Ana Revisora',
                'email' => 'ana.revisora@example.com',
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    ...$user,
                    'password' => Hash::make('password'),
                ],
            );
        }

        $motoristas = [
            ['nome' => 'Lucas Oliveira', 'pedidos' => 10, 'entregas' => 2],
            ['nome' => 'Mariana Souza', 'pedidos' => 9, 'entregas' => 3],
            ['nome' => 'Gabriel Santos', 'pedidos' => 5, 'entregas' => 5],
            ['nome' => 'Mateus Ferreira', 'pedidos' => 8, 'entregas' => 6],
            ['nome' => 'Julia Cavalcanti', 'pedidos' => 7, 'entregas' => 7],
            ['nome' => 'Pedro Henrique Lima', 'pedidos' => 8, 'entregas' => 1],
            ['nome' => 'Felipe Almeida', 'pedidos' => 3, 'entregas' => 2],
            ['nome' => 'Larissa Mendes', 'pedidos' => 10, 'entregas' => 10],
            ['nome' => 'Rafael Viana', 'pedidos' => 8, 'entregas' => 8],
            ['nome' => 'Gustavo Ramos', 'pedidos' => 10, 'entregas' => 9],
            ['nome' => 'Camila Rocha', 'pedidos' => 6, 'entregas' => 6],
            ['nome' => 'Bruno Martins', 'pedidos' => 12, 'entregas' => 4],
            ['nome' => 'Patricia Nunes', 'pedidos' => 4, 'entregas' => 1],
            ['nome' => 'Thiago Moreira', 'pedidos' => 11, 'entregas' => 10],
            ['nome' => 'Aline Barbosa', 'pedidos' => 7, 'entregas' => 4],
            ['nome' => 'Renato Araujo', 'pedidos' => 9, 'entregas' => 9],
            ['nome' => 'Fernanda Dias', 'pedidos' => 5, 'entregas' => 2],
            ['nome' => 'Diego Castro', 'pedidos' => 13, 'entregas' => 8],
            ['nome' => 'Carolina Freitas', 'pedidos' => 6, 'entregas' => 5],
            ['nome' => 'Eduardo Pinto', 'pedidos' => 8, 'entregas' => 0],
            ['nome' => 'Isabela Teixeira', 'pedidos' => 9, 'entregas' => 7],
            ['nome' => 'Rodrigo Campos', 'pedidos' => 10, 'entregas' => 10],
            ['nome' => 'Vanessa Duarte', 'pedidos' => 4, 'entregas' => 4],
            ['nome' => 'Andre Ribeiro', 'pedidos' => 12, 'entregas' => 6],
            ['nome' => 'Leticia Gomes', 'pedidos' => 6, 'entregas' => 3],
            ['nome' => 'Marcelo Correia', 'pedidos' => 7, 'entregas' => 6],
            ['nome' => 'Tatiane Lopes', 'pedidos' => 11, 'entregas' => 11],
            ['nome' => 'Caio Fernandes', 'pedidos' => 5, 'entregas' => 0],
            ['nome' => 'Priscila Batista', 'pedidos' => 9, 'entregas' => 8],
            ['nome' => 'Henrique Cardoso', 'pedidos' => 10, 'entregas' => 5],
        ];

        foreach ($motoristas as $index => $dadosMotorista) {
            $motorista = Motorista::query()->updateOrCreate(
                ['nome' => $dadosMotorista['nome']],
                ['nome' => $dadosMotorista['nome']],
            );

            $motorista->pedidos()->delete();

            $pedidos = [];
            $codigosReferencia = [
                '9874521360',
                '3698521470',
                '1230456789',
                '7894561230',
                '4569870123',
                '6547893210',
                '2589631470',
                '1597530246',
                '7539510864',
                '9517530642',
            ];
            $enderecosReferencia = [
                'Avenida Imirim, 3512 - Casa 2, Sao Paulo - SP 02464-300',
                'Rua Zilda, 87, Sao Paulo - SP 02327-080',
                'Travessa Doutor Zuquim, 145, Sao Paulo - SP 02324-170',
                'Rua Nova dos Portugueses, 987 - fundos, Sao Paulo - SP 02232-000',
                'Avenida Ataliba Leonel, 2541, Sao Paulo - SP 02242-001',
                'Rua Salvador Tolezano, 123, Sao Paulo - SP 02307-001',
                'Rua Tanque Velho, 456 - apt 14, Sao Paulo - SP 02334-020',
                'Rua Crisolito, 789, Sao Paulo - SP 02374-000',
                'Rua Palmares, 321 - Bloco A, Sao Paulo - SP 02041-000',
                'Avenida Ultramarino, 654, Sao Paulo - SP 02040-000',
            ];
            $cidades = [
                'Sao Paulo',
                'Guarulhos',
                'Osasco',
                'Barueri',
                'Santo Andre',
                'Sao Bernardo do Campo',
                'Diadema',
                'Maua',
            ];

            for ($pedido = 0; $pedido < $dadosMotorista['pedidos']; $pedido++) {
                $codigo = $index === 0 && isset($codigosReferencia[$pedido])
                    ? $codigosReferencia[$pedido]
                    : (string) (3000000000 + ($index * 100000) + $pedido);

                $endereco = $enderecosReferencia[$pedido % count($enderecosReferencia)];
                $cidade = $cidades[$index % count($cidades)];

                $pedidos[] = [
                    'codigo' => $codigo,
                    'endereco' => $index === 0
                        ? $endereco
                        : str_replace('Sao Paulo', $cidade, $endereco),
                    'status' => $pedido < $dadosMotorista['entregas']
                        ? Pedido::STATUS_ENTREGUE
                        : Pedido::STATUS_PENDENTE,
                    'solicitado_em' => now()
                        ->subDays($index)
                        ->subMinutes($pedido * 17),
                    'entregue_em' => $pedido < $dadosMotorista['entregas']
                        ? now()
                            ->subDays($index)
                            ->subHours(2)
                            ->subMinutes($pedido * 23)
                        : null,
                ];
            }

            $motorista->pedidos()->createMany($pedidos);
        }
    }
}
