from django.apps import AppConfig
from django.conf import settings


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"

    def ready(self):
        import os
        import sys

        if settings.DEBUG:
            return

        if os.getenv("DJANGO_ADMIN_USERNAME", "").strip() == "":
            return

        if sys.argv and sys.argv[0].endswith("manage.py"):
            return

        from django.db.utils import OperationalError, ProgrammingError

        from .bootstrap import bootstrap_admin_user

        try:
            bootstrap_admin_user()
        except (OperationalError, ProgrammingError):
            return
