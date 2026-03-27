"""add public figures and legal cases

Revision ID: 002_legal_cases
Revises: 001_initial
Create Date: 2026-03-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_legal_cases"
down_revision: Union[str, None] = None   # Set to your existing head if you have one
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── public_figures ────────────────────────────────────────────────────────
    op.create_table(
        "public_figures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("alias", sa.String(255), nullable=True),
        sa.Column(
            "position",
            sa.Enum(
                "president", "vice_president", "senator", "representative",
                "governor", "mayor", "vice_governor", "vice_mayor",
                "board_member", "councilor", "cabinet_secretary",
                "undersecretary", "bureau_director", "appointee", "other",
                name="figureposition",
            ),
            nullable=False,
            server_default="other",
        ),
        sa.Column("party", sa.String(100), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("photo_url", sa.String(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_figures_full_name", "public_figures", ["full_name"])

    # ── legal_cases ───────────────────────────────────────────────────────────
    op.create_table(
        "legal_cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "figure_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("public_figures.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("case_number", sa.String(100), nullable=True),
        sa.Column(
            "case_type",
            sa.Enum(
                "criminal", "administrative", "sandiganbayan",
                "comelec_disqualification", "ombudsman", "civil",
                name="casetype",
            ),
            nullable=False,
        ),
        sa.Column(
            "court_body",
            sa.Enum(
                "regional_trial_court", "metropolitan_trial_court",
                "sandiganbayan", "supreme_court", "court_of_appeals",
                "comelec", "ombudsman", "department_of_justice",
                "civil_service_commission", "other",
                name="courtbody",
            ),
            nullable=False,
            server_default="other",
        ),
        sa.Column(
            "status",
            sa.Enum(
                "filed", "pending", "on_trial", "on_appeal",
                "dismissed", "acquitted", "convicted",
                "disqualified", "reinstated", "unknown",
                name="casestatus",
            ),
            nullable=False,
            server_default="unknown",
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("charge", sa.String(255), nullable=True),
        sa.Column("penalty", sa.String(255), nullable=True),
        sa.Column("date_filed", sa.Date(), nullable=True),
        sa.Column("date_resolved", sa.Date(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("source_label", sa.String(255), nullable=True),
        sa.Column("added_by", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_cases_figure_id", "legal_cases", ["figure_id"])
    op.create_index("ix_cases_status",    "legal_cases", ["status"])
    op.create_index("ix_cases_type",      "legal_cases", ["case_type"])

    # ── verdict_cases (junction) ───────────────────────────────────────────────
    op.create_table(
        "verdict_cases",
        sa.Column(
            "verdict_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("verdicts.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "case_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("legal_cases.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("verdict_cases")
    op.drop_table("legal_cases")
    op.drop_index("ix_figures_full_name", "public_figures")
    op.drop_table("public_figures")
    op.execute("DROP TYPE IF EXISTS figureposition")
    op.execute("DROP TYPE IF EXISTS casetype")
    op.execute("DROP TYPE IF EXISTS courtbody")
    op.execute("DROP TYPE IF EXISTS casestatus")
