<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $service,
    ) {}

    public function index(Request $request)
    {
        $house = $request->user()->house;

        if (! $house) {
            return redirect()->route('onboarding');
        }

        return Inertia::render('dashboard/index', $this->service->getPageData($house));
    }
}
