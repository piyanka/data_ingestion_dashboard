import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or refresh a Django admin user from environment variables."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default=None,
            help="Admin username. Defaults to DJANGO_ADMIN_USERNAME.",
        )
        parser.add_argument(
            "--email",
            default=None,
            help="Admin email. Defaults to DJANGO_ADMIN_EMAIL.",
        )
        parser.add_argument(
            "--password",
            default=None,
            help="Admin password. Defaults to DJANGO_ADMIN_PASSWORD.",
        )

    def handle(self, *args, **options):
        username = options["username"] or self._env("DJANGO_ADMIN_USERNAME")
        email = options["email"] or self._env("DJANGO_ADMIN_EMAIL")
        password = options["password"] or self._env("DJANGO_ADMIN_PASSWORD")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Skipping admin bootstrap because DJANGO_ADMIN_USERNAME or "
                    "DJANGO_ADMIN_PASSWORD is not set."
                )
            )
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email or "",
                "is_staff": True,
                "is_superuser": True,
            },
        )

        changed_fields = []

        if email is not None and user.email != email:
            user.email = email
            changed_fields.append("email")

        if not user.is_staff:
            user.is_staff = True
            changed_fields.append("is_staff")

        if not user.is_superuser:
            user.is_superuser = True
            changed_fields.append("is_superuser")

        user.set_password(password)
        changed_fields.append("password")
        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created admin user '{username}' and set password."
                )
            )
            return

        if changed_fields:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Updated admin user '{username}' ({', '.join(changed_fields)})."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Admin user '{username}' is already up to date.")
            )

    @staticmethod
    def _env(name):
        value = os.getenv(name, "").strip()
        return value or None

