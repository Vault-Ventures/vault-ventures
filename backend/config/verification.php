<?php

return [
    // Fail closed until an operator explicitly selects local_capture on a local app.
    'phone_delivery' => env('VERIFICATION_PHONE_DELIVERY', 'disabled'),
];
