import os

from django.core.management.base import BaseCommand

from apps.core.bootstrap import bootstrap_admin_user


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
        username = options["username"]
        email = options["email"]
        password = options["password"]

        if username:
            os.environ["DJANGO_ADMIN_USERNAME"] = username
        if email is not None:
            os.environ["DJANGO_ADMIN_EMAIL"] = email
        if password:
            os.environ["DJANGO_ADMIN_PASSWORD"] = password

        result = bootstrap_admin_user()

        if result is None:
            self.stdout.write(
                self.style.WARNING(
                    "Skipping admin bootstrap because DJANGO_ADMIN_USERNAME or "
                    "DJANGO_ADMIN_PASSWORD is not set."
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Admin bootstrap completed successfully ({result})."
            )
        )
