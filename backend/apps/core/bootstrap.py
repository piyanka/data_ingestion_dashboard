import os

from django.contrib.auth import get_user_model


def bootstrap_admin_user():
    username = os.getenv("DJANGO_ADMIN_USERNAME", "").strip()
    password = os.getenv("DJANGO_ADMIN_PASSWORD", "").strip()
    email = os.getenv("DJANGO_ADMIN_EMAIL", "").strip()

    if not username or not password:
        return None

    User = get_user_model()
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "is_staff": True,
            "is_superuser": True,
        },
    )

    changed = False

    if email and user.email != email:
        user.email = email
        changed = True

    if not user.is_staff:
        user.is_staff = True
        changed = True

    if not user.is_superuser:
        user.is_superuser = True
        changed = True

    user.set_password(password)
    user.save()

    if created:
        return "created"
    if changed:
        return "updated"
    return "unchanged"
