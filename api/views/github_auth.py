import logging
import secrets
from urllib.parse import urlencode

import requests
from decouple import config
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse
from django.views.decorators.http import require_GET

from api.models.customer import Customer

logger = logging.getLogger(__name__)

GITHUB_CLIENT_ID = config("GITHUB_CLIENT_ID", default="")
GITHUB_CLIENT_SECRET = config("GITHUB_CLIENT_SECRET", default="")
GITHUB_SCOPE = config("GITHUB_SCOPE", default="read:user user:email")
FRONTEND_LOGIN_URL = config("FRONTEND_LOGIN_URL", default="http://localhost:3000/login")


def _build_callback_url(request):
    configured_redirect = config("GITHUB_REDIRECT_URI", default="")
    if configured_redirect:
        return configured_redirect
    return request.build_absolute_uri(reverse("github-callback"))


def _build_frontend_redirect(status, message="", user_id="", email=""):
    params = {"github": status}
    if message:
        params["message"] = message
    if user_id:
        params["id"] = user_id
    if email:
        params["email"] = email
    return f"{FRONTEND_LOGIN_URL}?{urlencode(params)}"


def _resolve_user_email(access_token, profile_data):
    email = profile_data.get("email")
    if email:
        return email

    email_res = requests.get(
        "https://api.github.com/user/emails",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=15,
    )
    if not email_res.ok:
        logger.warning("Cannot fetch GitHub emails: %s", email_res.text)
        return ""

    emails = email_res.json() or []
    if not emails:
        return ""

    primary_verified = next(
        (item for item in emails if item.get("primary") and item.get("verified")),
        None,
    )
    if primary_verified:
        return primary_verified.get("email", "")

    first_verified = next((item for item in emails if item.get("verified")), None)
    if first_verified:
        return first_verified.get("email", "")

    return emails[0].get("email", "")


@require_GET
def github_login(request):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        return JsonResponse({"error": "GitHub OAuth chưa được cấu hình."}, status=500)

    callback_url = _build_callback_url(request)
    state = secrets.token_urlsafe(24)
    request.session["github_oauth_state"] = state

    auth_params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": callback_url,
        "scope": GITHUB_SCOPE,
        "state": state,
    }
    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(auth_params)}"
    return redirect(auth_url)


@require_GET
def github_callback(request):
    error = request.GET.get("error")
    if error:
        description = request.GET.get("error_description", "GitHub từ chối đăng nhập.")
        return redirect(_build_frontend_redirect("error", description))

    code = request.GET.get("code")
    state = request.GET.get("state")
    expected_state = request.session.get("github_oauth_state")
    request.session.pop("github_oauth_state", None)

    if not code:
        return redirect(_build_frontend_redirect("error", "Thiếu mã xác thực từ GitHub."))
    if not expected_state or state != expected_state:
        return redirect(_build_frontend_redirect("error", "State OAuth không hợp lệ."))

    callback_url = _build_callback_url(request)

    try:
        token_res = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": callback_url,
                "state": state,
            },
            timeout=15,
        )
        token_data = token_res.json() if token_res.content else {}
        access_token = token_data.get("access_token")
        if not token_res.ok or not access_token:
            logger.error("GitHub token exchange failed: %s", token_data)
            return redirect(_build_frontend_redirect("error", "Không thể lấy access token GitHub."))

        user_res = requests.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=15,
        )
        if not user_res.ok:
            logger.error("GitHub user fetch failed: %s", user_res.text)
            return redirect(_build_frontend_redirect("error", "Không thể lấy thông tin người dùng GitHub."))

        profile = user_res.json() or {}
        email = _resolve_user_email(access_token, profile)
        if not email:
            return redirect(_build_frontend_redirect("error", "Tài khoản GitHub không có email khả dụng."))

        full_name = (profile.get("name") or "").strip()
        if full_name:
            name_parts = full_name.split()
            first_name = name_parts[0]
            last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        else:
            first_name = profile.get("login", "GitHubUser")
            last_name = ""

        customer = Customer.objects(email=email).first()
        if not customer:
            customer = Customer(
                email=email,
                password="github_oauth",
                first_name=first_name,
                last_name=last_name,
                phone="",
                address="",
                city="",
                province="",
                postal_code="",
            )
            customer.save()
        # Nếu đã có thì chỉ đăng nhập, không cập nhật thông tin

        request.session["user_id"] = str(customer.id)
        request.session["user_email"] = customer.email

        return redirect(
            _build_frontend_redirect(
                "success",
                "Đăng nhập GitHub thành công.",
                user_id=str(customer.id),
                email=customer.email,
            )
        )
    except requests.RequestException as exc:
        logger.error("GitHub OAuth network error: %s", exc)
        return redirect(_build_frontend_redirect("error", "Lỗi kết nối đến GitHub."))
    except Exception as exc:
        logger.exception("GitHub OAuth unexpected error: %s", exc)
        return redirect(_build_frontend_redirect("error", "Đã xảy ra lỗi khi đăng nhập GitHub."))
