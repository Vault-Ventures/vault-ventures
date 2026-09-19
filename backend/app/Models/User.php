<?php

namespace App\Models;

use App\Enums\ParticipantRole;
use App\Enums\VerificationTier;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function roles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function hasRole(ParticipantRole $role): bool
    {
        return $this->roles()->where('role', $role->value)->exists();
    }

    public function adminAccess(): HasOne
    {
        return $this->hasOne(AdminAccess::class);
    }

    public function hasAdminAccess(): bool
    {
        return $this->adminAccess()->exists();
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by_user_id');
    }

    public function isSuspended(): bool
    {
        return ! is_null($this->suspended_at);
    }

    public function founderProfile(): HasOne
    {
        return $this->hasOne(FounderProfile::class);
    }

    public function investorProfile(): HasOne
    {
        return $this->hasOne(InvestorProfile::class);
    }

    public function professionalProfile(): HasOne
    {
        return $this->hasOne(ProfessionalProfile::class);
    }

    public function founderConnections(): HasMany
    {
        return $this->hasMany(BusinessConnection::class, 'founder_user_id');
    }

    public function counterpartyConnections(): HasMany
    {
        return $this->hasMany(BusinessConnection::class, 'counterparty_user_id');
    }

    public function founderDeals(): HasMany
    {
        return $this->hasMany(Deal::class, 'founder_user_id');
    }

    public function counterpartyDeals(): HasMany
    {
        return $this->hasMany(Deal::class, 'counterparty_user_id');
    }

    public function dealMessages(): HasMany
    {
        return $this->hasMany(DealMessage::class, 'sender_user_id');
    }

    public function phoneVerificationCodes(): HasMany
    {
        return $this->hasMany(PhoneVerificationCode::class);
    }

    public function verificationRequests(): HasMany
    {
        return $this->hasMany(VerificationRequest::class);
    }

    public function latestVerificationRequest(): HasOne
    {
        return $this->hasOne(VerificationRequest::class)->latestOfMany();
    }

    public function givenFeedbacks(): HasMany
    {
        return $this->hasMany(DealFeedback::class, 'reviewer_user_id');
    }

    public function receivedFeedbacks(): HasMany
    {
        return $this->hasMany(DealFeedback::class, 'recipient_user_id');
    }

    public function hasVerifiedPhone(): bool
    {
        return ! is_null($this->phone_verified_at);
    }

    public function hasTier0Verification(): bool
    {
        return $this->hasVerifiedEmail() && $this->hasVerifiedPhone();
    }

    public function isIdentityVerified(): bool
    {
        return ($this->verification_tier?->value ?? (int) $this->verification_tier) >= 1;
    }

    public function isTrackRecordVerified(): bool
    {
        return ($this->verification_tier?->value ?? (int) $this->verification_tier) >= 2;
    }

    public function hasVerificationTier(VerificationTier|int $requiredTier): bool
    {
        $current = $this->verification_tier instanceof VerificationTier
            ? $this->verification_tier->value
            : (int) $this->verification_tier;

        $required = $requiredTier instanceof VerificationTier
            ? $requiredTier->value
            : (int) $requiredTier;

        return $current >= $required;
    }

    protected $attributes = [
        'verification_tier' => 0,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'headline',
        'bio',
        'location',
        'avatar_url',
        'cover_photo_url',
        'experience',
        'portfolio',
        'preferences',
        'suspended_at',
        'suspension_reason',
        'suspended_by_user_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'suspended_at' => 'datetime',
            'verification_tier' => VerificationTier::class,
            'password' => 'hashed',
            'experience' => 'array',
            'portfolio' => 'array',
            'preferences' => 'array',
        ];
    }
}
