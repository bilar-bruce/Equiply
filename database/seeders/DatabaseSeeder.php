<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\Rental;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database with initial users and facility inventory.
     */
    public function run(): void
    {
        // 1. Seed Initial Users (student, peer lender, custodian, admin)
        $student = User::updateOrCreate(
            ['id_number' => '2023-10042'],
            [
                'name' => 'Alex Rivera',
                'email' => 'alex.rivera@campus.edu',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => false,
                'contact_number' => '+639171234567',
                'status' => 'active',
            ]
        );

        $peerLender = User::updateOrCreate(
            ['id_number' => '2022-20088'],
            [
                'name' => 'Jordan Lee',
                'email' => 'jordan.lee@campus.edu',
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_peer_lender' => true,
                'contact_number' => '+639189876543',
                'status' => 'active',
            ]
        );

        $custodian = User::updateOrCreate(
            ['id_number' => 'EMP-2019-041'],
            [
                'name' => 'Maria Santos',
                'email' => 'custodian@campus.edu',
                'password' => Hash::make('custodian123'),
                'role' => 'custodian',
                'is_peer_lender' => false,
                'contact_number' => '+639195551234',
                'status' => 'active',
            ]
        );

        $admin = User::updateOrCreate(
            ['id_number' => 'ADM-2015-001'],
            [
                'name' => 'System Administrator',
                'email' => 'admin@campus.edu',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'is_peer_lender' => false,
                'contact_number' => '+639201112233',
                'status' => 'active',
            ]
        );

        // 2. Seed Facility Inventory Items (Laboratory Attire, Computation, Electronics)
        $itemsData = [
            // Laboratory Attire
            [
                'item_code' => 'EQ-LAB-001',
                'name' => 'Standard White Laboratory Coat (Size M)',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['chemistry', 'safety', 'size-m', 'lab-coat'],
                'specs' => [
                    'size' => 'M',
                    'gender' => 'Unisex',
                    'material' => '100% Cotton Drill',
                    'closure' => 'Snap Buttons',
                    'sleeve' => 'Long Sleeve',
                ],
            ],
            [
                'item_code' => 'EQ-LAB-002',
                'name' => 'Standard White Laboratory Coat (Size L)',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['chemistry', 'biology', 'size-l', 'lab-coat'],
                'specs' => [
                    'size' => 'L',
                    'gender' => 'Unisex',
                    'material' => '100% Cotton Drill',
                    'closure' => 'Snap Buttons',
                    'sleeve' => 'Long Sleeve',
                ],
            ],
            [
                'item_code' => 'EQ-LAB-003',
                'name' => 'Anti-Fog UV Safety Goggles',
                'category' => 'Laboratory Attire',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => false,
                'availability_stat' => 'available',
                'tags' => ['safety', 'eyewear', 'chemistry', 'ppe'],
                'specs' => [
                    'lens' => 'Polycarbonate',
                    'uv_protection' => 'UV400',
                    'ventilation' => 'Indirect Vents',
                    'anti_scratch' => true,
                ],
            ],

            // Computation
            [
                'item_code' => 'EQ-CMP-001',
                'name' => 'Casio ClassWiz fx-991CW Scientific Calculator',
                'category' => 'Computation',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['math', 'engineering', 'exam-approved', 'calculator'],
                'specs' => [
                    'model' => 'fx-991CW',
                    'power' => 'Solar/Battery',
                    'approved_exams' => true,
                    'display' => '4-tone Natural Textbook Display',
                    'functions_count' => 540,
                ],
            ],
            [
                'item_code' => 'EQ-CMP-002',
                'name' => 'Casio ClassWiz fx-991EX Scientific Calculator',
                'category' => 'Computation',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['math', 'statistics', 'exam-approved', 'calculator'],
                'specs' => [
                    'model' => 'fx-991EX',
                    'power' => 'Solar/Battery',
                    'approved_exams' => true,
                    'display' => 'High-Resolution LCD',
                    'functions_count' => 552,
                ],
            ],
            [
                'item_code' => 'EQ-CMP-003',
                'name' => 'Texas Instruments TI-84 Plus CE Graphing Calculator',
                'category' => 'Computation',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['graphing', 'calculus', 'advanced-math', 'calculator'],
                'specs' => [
                    'model' => 'TI-84 Plus CE',
                    'power' => 'Rechargeable Li-ion',
                    'approved_exams' => true,
                    'display' => 'Color Backlit LCD 320x240',
                    'storage' => '3MB Flash ROM',
                ],
            ],

            // Electronics
            [
                'item_code' => 'EQ-ELE-001',
                'name' => 'Heavy-Duty 10-Meter Extension Cord (Surge Protected)',
                'category' => 'Electronics',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => false,
                'availability_stat' => 'available',
                'tags' => ['power', 'extension-cord', 'surge-protection', 'workshop'],
                'specs' => [
                    'length_meters' => 10,
                    'outlets' => 4,
                    'voltage_rating' => '250V / 16A',
                    'surge_protection_joules' => 1050,
                    'safety_shutter' => true,
                ],
            ],
            [
                'item_code' => 'EQ-ELE-002',
                'name' => 'UNI-T Digital Multimeter with Probes',
                'category' => 'Electronics',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['testing', 'multimeter', 'circuits', 'hardware'],
                'specs' => [
                    'model' => 'UT61E+',
                    'counts' => 22000,
                    'measurement' => 'True RMS AC/DC Voltage & Current',
                    'safety_rating' => 'CAT III 1000V / CAT IV 600V',
                ],
            ],
            [
                'item_code' => 'EQ-ELE-003',
                'name' => 'Hakko FX-888D Soldering Station Kit',
                'category' => 'Electronics',
                'owner_type' => 'facility',
                'owner_user_id' => null,
                'rental_rate_hr' => 0.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['soldering', 'hardware', 'prototyping', 'electronics'],
                'specs' => [
                    'model' => 'FX-888D',
                    'wattage' => 70,
                    'temp_range' => '200°C - 480°C',
                    'esd_safe' => true,
                ],
            ],

            // Student Peer-to-Peer Item
            [
                'item_code' => 'EQ-P2P-001',
                'name' => 'Arduino Starter Kit with Uno R3 & 30+ Sensors',
                'category' => 'Electronics',
                'owner_type' => 'student',
                'owner_user_id' => $peerLender->_id,
                'rental_rate_hr' => 15.00,
                'deposit_required' => true,
                'availability_stat' => 'available',
                'tags' => ['arduino', 'microcontroller', 'p2p', 'student-owned', 'iot'],
                'specs' => [
                    'microcontroller' => 'ATmega328P',
                    'board' => 'Uno R3 Compatible',
                    'includes' => '30+ Sensors, Breadboard, Jumper Wires',
                    'condition' => 'Excellent',
                ],
            ],
        ];

        $seededItems = [];
        foreach ($itemsData as $itemData) {
            $seededItems[$itemData['item_code']] = Item::updateOrCreate(
                ['item_code' => $itemData['item_code']],
                $itemData
            );
        }

        // 3. Seed Sample Rental Record (Materializes 'rentals' collection with embedded subdocuments)
        $calculatorItem = $seededItems['EQ-CMP-001'] ?? null;
        if ($calculatorItem) {
            Rental::updateOrCreate(
                ['rental_code' => 'RNT-2026-X89J'],
                [
                    'item_id' => $calculatorItem->_id,
                    'borrower_id' => $student->_id,
                    'custodian_id' => $custodian->_id,
                    'status' => 'active',
                    'schedule' => [
                        'requested_at' => now()->subHours(2)->toIso8601String(),
                        'due_time' => now()->addHours(4)->toIso8601String(),
                        'returned_time' => null,
                    ],
                    'item_snapshot' => [
                        'name' => $calculatorItem->name,
                        'owner_type' => $calculatorItem->owner_type,
                        'owner_id' => $calculatorItem->owner_user_id,
                    ],
                    'condition_logs' => [
                        'condition_out' => 'Unit clean, screen intact, battery fully charged',
                        'condition_in' => null,
                    ],
                    'financials' => [
                        'total_fee' => 0.00,
                        'collateral_held' => 'School ID: ' . $student->id_number,
                    ],
                ]
            );
        }
    }
}
