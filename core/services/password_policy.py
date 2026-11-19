import re


def get_password_policy_errors(
    password: str,
    confirm_password: str | None = None,
    current_password: str | None = None,
) -> list[str]:
    errors = []

    if not password or len(password) < 12:
        errors.append("mínimo 12 caracteres")
    if not re.search(r"[A-Z]", password or ""):
        errors.append("al menos una mayúscula (A-Z)")
    if not re.search(r"[a-z]", password or ""):
        errors.append("al menos una minúscula (a-z)")
    if not re.search(r"[0-9]", password or ""):
        errors.append("al menos un número (0-9)")
    if not re.search(r"[^A-Za-z0-9\s]", password or ""):
        errors.append("al menos un símbolo (!@#$%...)")
    if re.search(r"\s", password or ""):
        errors.append("sin espacios en blanco")
    if confirm_password is not None and password != confirm_password:
        errors.append("las contraseñas deben coincidir")
    if current_password and password == current_password:
        errors.append("debe ser distinta a la contraseña actual")

    return errors


def format_password_policy_error(errors: list[str]) -> str:
    return f"La contraseña aún no cumple con: {', '.join(errors)}."