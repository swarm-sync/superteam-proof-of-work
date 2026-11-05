<?php

namespace App\Http\Requests;

class UpdateBountyRequest extends StoreBountyRequest
{
    // Same rules as creation; status transitions stay inside Bounty::STATUSES.
}
